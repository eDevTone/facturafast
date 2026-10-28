import { db } from '@database/client'
import { invoices } from '@database/schemas/invoices.schema'
import { decryptString } from '@features/fiscal-profile/services/certificate.service'
import { getIssuingProfileWithSecrets } from '@features/fiscal-profile/services/fiscal-profile.service'
import { profileHasCSD } from '@features/fiscal-profile/types/fiscal-profile.types'
import { hasActivePayments } from '@features/payments/services/payment.service'
import { formatDayLong } from '@features/payments/utils/payment-dates'
import { getSatCfdiStatus, statusQueryFromCfdi, type SatCfdiStatus } from '@features/stamping/services/sat-status.service'
import { cancelInvoice as swCancelInvoice } from '@features/stamping/services/sw-client.service'
import {
  cancellationDeadline,
  decideCancellation,
  satAnswerColumns,
  UUID_PATTERN,
  type CancellationDecision,
} from '@features/stamping/utils/cancellation'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { uploadFile } from '@features/storage/services/r2.service'
import { and, eq, isNull, lt, or } from 'drizzle-orm'
import { CANCEL_BLOCKED_BY_PAYMENTS, type CancellationReason } from '../constants/cancellation-reasons'
import type { CancellationPreview } from '../types/invoice.types'

type InvoiceRow = typeof invoices.$inferSelect

/** How often the list may ask the SAT again about a pending cancellation. */
const PENDING_REFRESH_MS = 10 * 60 * 1000
const PENDING_REFRESH_LIMIT = 10

export type CancelInvoiceResult =
  | { success: true; outcome: 'cancelada' | 'en_proceso'; cancellable: string | null }
  | { success: false; error: string; code?: string }


async function findInvoice(invoiceId: string, userId: string) {
  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)),
  })
}

/** Saves a SAT answer on the invoice and moves its cancellation where the answer says. */
async function applySatAnswer(invoice: InvoiceRow, answer: SatCfdiStatus): Promise<CancellationDecision> {
  const now = new Date()
  const pending = invoice.cancellationStatus === 'en_proceso' ? { requestedAt: invoice.cancellationRequestedAt } : null
  const decision = decideCancellation(answer, pending, now)

  await db
    .update(invoices)
    .set({
      ...satAnswerColumns(answer, now),
      ...(decision === 'cancelled' && {
        status: 'cancelada' as const,
        cancellationStatus: null,
        cancelledAt: invoice.cancelledAt ?? now,
      }),
      ...(decision === 'rejected' && { cancellationStatus: 'rechazada' as const }),
    })
    .where(eq(invoices.id, invoice.id))

  return decision
}

async function askSat(invoice: InvoiceRow): Promise<SatCfdiStatus> {
  if (!invoice.xmlContent) throw new Error('La factura no tiene su XML timbrado.')
  return getSatCfdiStatus(statusQueryFromCfdi(invoice.xmlContent))
}

/**
 * Asks the SAT for the cancellation of a CFDI through SW Sapien.
 *
 * SW only confirms that the SAT received the request: the invoice stays `timbrada`, with the
 * request `en_proceso`, until the SAT reports it cancelled. Right after the request the SAT is
 * asked once; without acceptance it is usually cancelled already.
 */
export async function cancelInvoice(
  invoiceId: string,
  userId: string,
  reason: CancellationReason,
  replacementUuid?: string,
): Promise<CancelInvoiceResult> {
  const invoice = await findInvoice(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'timbrada') throw new Error('Solo se pueden cancelar facturas timbradas')
  if (!invoice.uuid || !invoice.xmlContent) throw new Error('La factura no tiene UUID fiscal')
  if (!invoice.issuingProfileId) throw new Error('La factura no tiene perfil emisor')
  if (invoice.cancellationStatus === 'en_proceso') {
    throw new Error('Ya pediste cancelar esta factura. Espera la respuesta del SAT o actualiza su estatus.')
  }
  // The SAT cancels an invoice only after its related CFDI (RMF 2026, regla 2.7.1.34).
  if (await hasActivePayments(invoiceId, userId)) throw new Error(CANCEL_BLOCKED_BY_PAYMENTS)

  const substituteUuid = reason === '01' ? (replacementUuid?.trim() || invoice.cancellationSubstituteUuid) : null
  if (reason === '01' && !substituteUuid) throw new Error('El motivo 01 necesita el UUID de la factura que la sustituye.')
  if (substituteUuid && !UUID_PATTERN.test(substituteUuid)) throw new Error('El UUID de la factura que la sustituye no es válido.')

  const query = statusQueryFromCfdi(invoice.xmlContent)
  const deadline = cancellationDeadline(invoice.issuedAt, query.issuerRfc)
  if (todayInMexico() > deadline) {
    throw new Error(`Ya venció el plazo para cancelarla: el SAT lo permitía hasta el ${formatDayLong(deadline)} de ${deadline.slice(0, 4)}.`)
  }

  const profile = await getIssuingProfileWithSecrets(invoice.issuingProfileId, userId)
  if (!profile) throw new Error('Perfil emisor no encontrado')
  if (!profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')

  const result = await swCancelInvoice({
    uuid: invoice.uuid,
    issuerRfc: profile.rfc,
    reason,
    replacementUuid: substituteUuid ?? undefined,
    cerBase64: profile.cerBase64!,
    keyBase64: profile.keyBase64!,
    keyPassword: decryptString(profile.keyPassword!),
  })
  if (!result.success) {
    return { success: false, error: result.error ?? 'No se pudo cancelar la factura', code: result.code }
  }

  const requestedAt = new Date()
  await db
    .update(invoices)
    .set({
      cancellationStatus: 'en_proceso',
      cancellationReason: reason,
      cancellationRequestedAt: requestedAt,
      cancellationSubstituteUuid: substituteUuid ?? invoice.cancellationSubstituteUuid,
    })
    .where(eq(invoices.id, invoiceId))

  if (result.acknowledgment) {
    try {
      const acuseKey = await uploadFile(userId, `${invoice.uuid}-acuse`, Buffer.from(result.acknowledgment, 'utf-8'), 'xml')
      await db.update(invoices).set({ cancellationAcuseUrl: acuseKey }).where(eq(invoices.id, invoiceId))
    } catch (error) {
      console.error('[cancel] Acuse upload failed (the request was sent):', error instanceof Error ? error.message : error)
    }
  }

  // Best effort: when the SAT does not answer, the invoice stays en_proceso until the next query.
  try {
    const answer = await askSat(invoice)
    const decision = await applySatAnswer(
      { ...invoice, cancellationStatus: 'en_proceso', cancellationRequestedAt: requestedAt },
      answer,
    )
    return { success: true, outcome: decision === 'cancelled' ? 'cancelada' : 'en_proceso', cancellable: answer.cancellable }
  } catch (error) {
    console.error('[cancel] SAT status query failed:', error instanceof Error ? error.message : error)
    return { success: true, outcome: 'en_proceso', cancellable: invoice.satCancellable }
  }
}

/** Asks the SAT where an invoice stands and saves the answer. */
export async function refreshCancellationStatus(invoiceId: string, userId: string) {
  const invoice = await findInvoice(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status === 'draft') throw new Error('Un borrador no tiene estatus ante el SAT')

  const answer = await askSat(invoice)
  const decision = await applySatAnswer(invoice, answer)
  return { decision, answer }
}

/**
 * Pending cancellations whose last query is older than 10 minutes, at most 10 per call; for the
 * list, so a resolved cancellation shows without opening each invoice. Returns how many changed.
 */
export async function refreshPendingCancellations(userId: string): Promise<number> {
  const pending = await db.query.invoices.findMany({
    where: and(
      eq(invoices.userId, userId),
      eq(invoices.status, 'timbrada'),
      eq(invoices.cancellationStatus, 'en_proceso'),
      or(isNull(invoices.satCheckedAt), lt(invoices.satCheckedAt, new Date(Date.now() - PENDING_REFRESH_MS))),
    ),
    limit: PENDING_REFRESH_LIMIT,
  })

  let changed = 0
  for (const invoice of pending) {
    try {
      if ((await applySatAnswer(invoice, await askSat(invoice))) !== 'unchanged') changed++
    } catch (error) {
      console.error('[cancel] Pending status query failed:', invoice.id, error instanceof Error ? error.message : error)
    }
  }
  return changed
}

/**
 * What the dialogs show before cancelling or correcting: whether the client will have to accept
 * (EsCancelable) and until when it can be cancelled.
 */
export async function getCancellationPreview(invoiceId: string, userId: string): Promise<CancellationPreview> {
  const invoice = await findInvoice(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (!invoice.xmlContent) throw new Error('La factura no está timbrada')

  const deadline = cancellationDeadline(invoice.issuedAt, statusQueryFromCfdi(invoice.xmlContent).issuerRfc)
  const preview = { deadline, expired: todayInMexico() > deadline }

  try {
    const answer = await askSat(invoice)
    const decision = await applySatAnswer(invoice, answer)
    return { ...preview, cancellable: answer.cancellable, cancelled: decision === 'cancelled' }
  } catch (error) {
    console.error('[cancel] SAT preview query failed:', error instanceof Error ? error.message : error)
    return { ...preview, cancellable: null, cancelled: false, error: 'No pudimos consultar al SAT; intenta en unos minutos.' }
  }
}
