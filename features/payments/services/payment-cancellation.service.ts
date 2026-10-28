import { db } from '@database/client'
import { paymentDocuments, payments } from '@database/schemas/payments.schema'
import { decryptString } from '@features/fiscal-profile/services/certificate.service'
import { getIssuingProfileWithSecrets } from '@features/fiscal-profile/services/fiscal-profile.service'
import { profileHasCSD } from '@features/fiscal-profile/types/fiscal-profile.types'
import type { CancellationPreview } from '@features/invoicing/types/invoice.types'
import { getSatCfdiStatus, statusQueryFromCfdi, type SatCfdiStatus } from '@features/stamping/services/sat-status.service'
import { cancelInvoice as swCancel } from '@features/stamping/services/sw-client.service'
import {
  cancellationDeadline,
  decideCancellation,
  satAnswerColumns,
  UUID_PATTERN,
  type CancellationDecision,
} from '@features/stamping/utils/cancellation'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { uploadFile } from '@features/storage/services/r2.service'
import { and, asc, eq, inArray, isNull, lt, or } from 'drizzle-orm'
import { countingPayments } from '../utils/payment-amounts'
import { formatDayLong } from '../utils/payment-dates'

type PaymentRow = typeof payments.$inferSelect

/** c_MotivoCancelacion of a complemento: 01 when a correction replaces it. */
export type PaymentCancellationReason = '01' | '02' | '03'

export type CancelPaymentResult =
  | { success: true; outcome: 'cancelado' | 'en_proceso'; cancellable: string | null }
  | { success: false; error: string; code?: string }

/** Payments of an invoice as the balance sees them, in installment order. */
async function invoicePaymentRows(invoiceId: string, userId: string) {
  return db
    .select({
      id: payments.id,
      uuid: payments.uuid,
      relatedUuid: payments.relatedUuid,
      status: payments.status,
      amountPaid: paymentDocuments.amountPaid,
    })
    .from(paymentDocuments)
    .innerJoin(payments, eq(paymentDocuments.paymentId, payments.id))
    .where(and(eq(paymentDocuments.invoiceId, invoiceId), eq(payments.userId, userId)))
    .orderBy(asc(paymentDocuments.installment), asc(payments.createdAt))
}

/**
 * The last payment of an invoice that still takes its balance: the only one that can be corrected
 * or cancelled, so installments and balances never skip.
 */
export async function getLastCountingPayment(invoiceId: string, userId: string) {
  const counting = countingPayments(await invoicePaymentRows(invoiceId, userId))
  const last = counting.at(-1)
  return last?.status === 'timbrado' ? last : null
}

async function findPayment(paymentId: string, userId: string) {
  return db.query.payments.findFirst({
    where: and(eq(payments.id, paymentId), eq(payments.userId, userId)),
    with: { documents: true },
  })
}

/** Saves a SAT answer on the payment and moves its cancellation where the answer says. */
async function applySatAnswer(payment: PaymentRow, answer: SatCfdiStatus): Promise<CancellationDecision> {
  const now = new Date()
  const pending = payment.cancellationStatus === 'en_proceso' ? { requestedAt: payment.cancellationRequestedAt } : null
  const decision = decideCancellation(answer, pending, now)

  await db
    .update(payments)
    .set({
      ...satAnswerColumns(answer, now),
      ...(decision === 'cancelled' && {
        status: 'cancelado' as const,
        cancellationStatus: null,
        cancelledAt: payment.cancelledAt ?? now,
      }),
      ...(decision === 'rejected' && { cancellationStatus: 'rechazada' as const }),
    })
    .where(eq(payments.id, payment.id))

  return decision
}

async function askSat(payment: PaymentRow): Promise<SatCfdiStatus> {
  if (payment.status === 'en_timbrado' || !payment.xmlContent) throw new Error('El complemento no está timbrado.')
  return getSatCfdiStatus(statusQueryFromCfdi(payment.xmlContent))
}

/**
 * Asks the SAT to cancel a complemento de pago. A complemento always needs the client's
 * acceptance, except on the business day after it was issued (RMF 2026, regla 2.7.1.35), so it
 * usually stays `en_proceso` until the SAT reports it cancelled; then its amount returns to the
 * invoice balance.
 *
 * With 02 or 03 only the last payment of the invoice can be cancelled; with 01, the one a
 * correction replaced.
 */
export async function cancelPayment(
  paymentId: string,
  userId: string,
  reason: PaymentCancellationReason,
  substituteUuid?: string,
): Promise<CancelPaymentResult> {
  const payment = await findPayment(paymentId, userId)
  if (!payment) throw new Error('Cobro no encontrado')
  if (payment.status !== 'timbrado' || !payment.uuid || !payment.xmlContent) throw new Error('Solo se cancelan cobros timbrados.')
  if (payment.cancellationStatus === 'en_proceso') throw new Error('Ya pediste cancelar este cobro. Espera la respuesta del SAT.')

  const replacement = reason === '01' ? (substituteUuid?.trim() || payment.cancellationSubstituteUuid) : null
  if (reason === '01') {
    if (!replacement || !UUID_PATTERN.test(replacement)) throw new Error('El motivo 01 necesita el UUID del complemento que lo sustituye.')
  } else {
    if (payment.cancellationSubstituteUuid) throw new Error('Este cobro ya tiene un complemento que lo sustituye; su cancelación va con el motivo 01.')
    const invoiceId = payment.documents[0]?.invoiceId
    const last = invoiceId ? await getLastCountingPayment(invoiceId, userId) : null
    if (last?.id !== payment.id) throw new Error('Solo se puede cancelar el último cobro de la factura.')
  }

  const query = statusQueryFromCfdi(payment.xmlContent)
  const deadline = cancellationDeadline(payment.issuedAt ?? payment.stampedAt ?? new Date(), query.issuerRfc)
  if (todayInMexico() > deadline) {
    throw new Error(`Ya venció el plazo para cancelarlo: el SAT lo permitía hasta el ${formatDayLong(deadline)} de ${deadline.slice(0, 4)}.`)
  }

  const profile = await getIssuingProfileWithSecrets(payment.issuingProfileId, userId)
  if (!profile || !profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')

  const result = await swCancel({
    uuid: payment.uuid,
    issuerRfc: profile.rfc,
    reason,
    replacementUuid: replacement ?? undefined,
    cerBase64: profile.cerBase64!,
    keyBase64: profile.keyBase64!,
    keyPassword: decryptString(profile.keyPassword!),
  })
  if (!result.success) {
    return { success: false, error: result.error ?? 'No se pudo cancelar el complemento', code: result.code }
  }

  const requestedAt = new Date()
  await db
    .update(payments)
    .set({
      cancellationStatus: 'en_proceso',
      cancellationReason: reason,
      cancellationRequestedAt: requestedAt,
      cancellationSubstituteUuid: replacement ?? payment.cancellationSubstituteUuid,
    })
    .where(eq(payments.id, payment.id))

  if (result.acknowledgment) {
    try {
      const acuseKey = await uploadFile(userId, `${payment.uuid}-acuse`, Buffer.from(result.acknowledgment, 'utf-8'), 'xml')
      await db.update(payments).set({ cancellationAcuseUrl: acuseKey }).where(eq(payments.id, payment.id))
    } catch (error) {
      console.error('[payments] Acuse upload failed (the request was sent):', error instanceof Error ? error.message : error)
    }
  }

  // Best effort: when the SAT does not answer, the payment stays en_proceso until the next query.
  try {
    const answer = await askSat(payment)
    const decision = await applySatAnswer({ ...payment, cancellationStatus: 'en_proceso', cancellationRequestedAt: requestedAt }, answer)
    return { success: true, outcome: decision === 'cancelled' ? 'cancelado' : 'en_proceso', cancellable: answer.cancellable }
  } catch (error) {
    console.error('[payments] SAT status query failed:', error instanceof Error ? error.message : error)
    return { success: true, outcome: 'en_proceso', cancellable: payment.satCancellable }
  }
}

/**
 * Asks the SAT about the payments of an invoice whose cancellation is pending and whose last
 * query is older than `minAgeMs`. Returns how many changed.
 */
export async function refreshPaymentCancellations(invoiceId: string, userId: string, minAgeMs = 60_000): Promise<number> {
  const ids = (await invoicePaymentRows(invoiceId, userId)).map((payment) => payment.id)
  if (ids.length === 0) return 0

  const pending = await db.query.payments.findMany({
    where: and(
      inArray(payments.id, ids),
      eq(payments.cancellationStatus, 'en_proceso'),
      or(isNull(payments.satCheckedAt), lt(payments.satCheckedAt, new Date(Date.now() - minAgeMs))),
    ),
  })

  let changed = 0
  for (const payment of pending) {
    try {
      if ((await applySatAnswer(payment, await askSat(payment))) !== 'unchanged') changed++
    } catch (error) {
      console.error('[payments] Pending status query failed:', payment.id, error instanceof Error ? error.message : error)
    }
  }
  return changed
}

/** For the cancel dialog: whether the client will have to accept, and until when. */
export async function getPaymentCancellationPreview(paymentId: string, userId: string): Promise<CancellationPreview> {
  const payment = await findPayment(paymentId, userId)
  if (!payment) throw new Error('Cobro no encontrado')
  if (!payment.xmlContent || payment.status === 'en_timbrado') throw new Error('El complemento no está timbrado')

  const deadline = cancellationDeadline(payment.issuedAt ?? payment.stampedAt ?? new Date(), statusQueryFromCfdi(payment.xmlContent).issuerRfc)
  const preview = { deadline, expired: todayInMexico() > deadline }

  try {
    const answer = await askSat(payment)
    const decision = await applySatAnswer(payment, answer)
    return { ...preview, cancellable: answer.cancellable, cancelled: decision === 'cancelled' }
  } catch (error) {
    console.error('[payments] SAT preview query failed:', error instanceof Error ? error.message : error)
    return { ...preview, cancellable: null, cancelled: false, error: 'No pudimos consultar al SAT; intenta en unos minutos.' }
  }
}
