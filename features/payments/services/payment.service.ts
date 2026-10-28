import { db } from '@database/client'
import { invoices } from '@database/schemas/invoices.schema'
import { paymentDocuments, payments } from '@database/schemas/payments.schema'
import { paymentForms } from '@database/schemas/sat-catalogs.schema'
import { consumeStamp, refundStamp } from '@features/billing/services/account.service'
import { decryptString } from '@features/fiscal-profile/services/certificate.service'
import { getIssuingProfileById, getIssuingProfileWithSecrets } from '@features/fiscal-profile/services/fiscal-profile.service'
import { isCertExpired, profileHasCSD } from '@features/fiscal-profile/types/fiscal-profile.types'
import { csdExpiredMessage } from '@features/fiscal-profile/utils/csd-expiry'
import { readXmlTotals } from '@features/invoicing/utils/invoice-amounts'
import { buildPaymentXml } from '@features/stamping/services/payment-xml-builder.service'
import { stampInvoice as swStamp } from '@features/stamping/services/sw-client.service'
import { sealXml } from '@features/stamping/services/xml-seal.service'
import type { StampingResult } from '@features/stamping/types/stamping.types'
import { formatCfdiDate, todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { sendPaymentEmail } from '@features/notifications/services/email.service'
import { generatePaymentPdf } from '@features/storage/services/pdf-generator.service'
import { uploadFile } from '@features/storage/services/r2.service'
import { and, asc, eq, inArray, isNull, lt, notExists, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { InvoicePayment, PaymentReplacementOutcome, PaymentResult, PaymentStatus, RegisterPaymentInput } from '../types/payment.types'
import { computePaymentDocument, countingPayments, invoiceBalance, readInvoiceTaxLines } from '../utils/payment-amounts'
import { formatDay } from '../utils/payment-dates'
import { cancelPayment, getLastCountingPayment } from './payment-cancellation.service'

/** Serie of the complementos de pago; folios run per issuing profile. */
export const PAYMENT_SERIE = 'P'

/** A stamping attempt older than this is considered dead and can be retried. */
const STAMPING_LOCK_MS = 2 * 60 * 1000

/** Payments that take an invoice balance: stamped, or reserved while the PAC answers. */
const ACTIVE_STATUSES: PaymentStatus[] = ['en_timbrado', 'timbrado']

class NoStampsError extends Error {
  constructor() {
    super('No stamps left')
  }
}

/** Total of the stamped CFDI; the stored total of invoices stamped before 2026-10-16 may differ. */
export function stampedTotal(invoice: { total: string; xmlContent: string | null }): number {
  return (invoice.xmlContent ? readXmlTotals(invoice.xmlContent)?.total : null) ?? Number(invoice.total)
}

/** Payments applied to an invoice, in installment order. */
export async function getInvoicePayments(invoiceId: string, userId: string): Promise<InvoicePayment[]> {
  return db
    .select({
      id: payments.id,
      serie: payments.serie,
      folio: payments.folio,
      paidOn: payments.paidOn,
      paymentForm: payments.paymentForm,
      amount: payments.amount,
      operationNumber: payments.operationNumber,
      status: payments.status,
      uuid: payments.uuid,
      stampingStartedAt: payments.stampingStartedAt,
      stampedAt: payments.stampedAt,
      xmlUrl: payments.xmlUrl,
      pdfUrl: payments.pdfUrl,
      installment: paymentDocuments.installment,
      previousBalance: paymentDocuments.previousBalance,
      amountPaid: paymentDocuments.amountPaid,
      remainingBalance: paymentDocuments.remainingBalance,
      unconfirmed: sql<boolean>`(${payments.status} = 'en_timbrado' AND (${payments.stampingStartedAt} IS NULL OR ${payments.stampingStartedAt} < now() - make_interval(secs => ${STAMPING_LOCK_MS / 1000})))`,
      currency: payments.currency,
      exchangeRate: payments.exchangeRate,
      relatedUuid: payments.relatedUuid,
      cancellationStatus: payments.cancellationStatus,
      cancellationReason: payments.cancellationReason,
      cancellationRequestedAt: payments.cancellationRequestedAt,
      cancellationSubstituteUuid: payments.cancellationSubstituteUuid,
      satCancellable: payments.satCancellable,
      satCancellationStatus: payments.satCancellationStatus,
      satCheckedAt: payments.satCheckedAt,
    })
    .from(paymentDocuments)
    .innerJoin(payments, eq(paymentDocuments.paymentId, payments.id))
    .where(and(eq(paymentDocuments.invoiceId, invoiceId), eq(payments.userId, userId)))
    .orderBy(asc(paymentDocuments.installment), asc(payments.createdAt))
}

/** Amount collected per invoice id, only for invoices that have payments. */
export async function getPaidAmountsByInvoice(userId: string): Promise<Record<string, number>> {
  // A complemento replaced by a correction no longer counts (see `countingPayments`).
  const substitute = alias(payments, 'substitute')
  const rows = await db
    .select({
      invoiceId: paymentDocuments.invoiceId,
      paid: sql<string>`sum(${paymentDocuments.amountPaid})`,
    })
    .from(paymentDocuments)
    .innerJoin(payments, eq(paymentDocuments.paymentId, payments.id))
    .where(and(
      eq(payments.userId, userId),
      inArray(payments.status, ACTIVE_STATUSES),
      notExists(
        db
          .select({ id: substitute.id })
          .from(substitute)
          .where(and(eq(substitute.relatedUuid, payments.uuid), inArray(substitute.status, ACTIVE_STATUSES))),
      ),
    ))
    .groupBy(paymentDocuments.invoiceId)

  return Object.fromEntries(rows.map((row) => [row.invoiceId, Number(row.paid)]))
}

/** True while the invoice has complementos de pago that are stamped or being stamped. */
export async function hasActivePayments(invoiceId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: payments.id })
    .from(paymentDocuments)
    .innerJoin(payments, eq(paymentDocuments.paymentId, payments.id))
    .where(and(
      eq(paymentDocuments.invoiceId, invoiceId),
      eq(payments.userId, userId),
      inArray(payments.status, ACTIVE_STATUSES),
    ))
    .limit(1)
  return rows.length > 0
}

async function assertPaymentForm(code: string) {
  if (code === '99') throw new Error('Elige cómo te pagaron; "Por definir" no aplica a un cobro.')
  const rows = await db.select({ code: paymentForms.code }).from(paymentForms).where(eq(paymentForms.code, code)).limit(1)
  if (rows.length === 0) throw new Error('La forma de pago no existe en el catálogo del SAT.')
}

/**
 * "Registrar cobro": stamps the complemento de pago of one payment of a PPD invoice.
 *
 * 1. In one transaction, lock the invoice, take its balance and installment from the payments
 *    already applied, insert the payment as `en_timbrado` with the next folio of the serie, and
 *    reserve one stamp. A second request for the same invoice, or one without stamps, stops here.
 * 2. Seal and stamp it (`stampPayment`).
 */
export async function registerPayment(userId: string, input: RegisterPaymentInput): Promise<PaymentResult> {
  return reserveAndStamp(userId, input, null)
}

type PaymentRow = typeof payments.$inferSelect

/**
 * Registers a payment, or the correction of one (`replaces`): a correction leaves the replaced
 * complemento out of the balance, so it takes its installment and previous balance, and its XML
 * relates to it with TipoRelacion 04.
 */
async function reserveAndStamp(userId: string, input: RegisterPaymentInput, replaces: PaymentRow | null): Promise<PaymentResult> {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, input.invoiceId), eq(invoices.userId, userId)),
  })
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'timbrada' || !invoice.uuid || !invoice.xmlContent) {
    throw new Error('Solo se registran cobros de facturas timbradas')
  }
  if (invoice.paymentMethod !== 'PPD') throw new Error('Solo las facturas PPD llevan complemento de pago')
  if (!invoice.issuingProfileId) throw new Error('La factura no tiene un perfil emisor asignado')

  const profile = await getIssuingProfileWithSecrets(invoice.issuingProfileId, userId)
  if (!profile) throw new Error('Perfil emisor no encontrado')
  if (!profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')
  if (isCertExpired(profile)) throw new Error(csdExpiredMessage(profile.certValidUntil!))

  await assertPaymentForm(input.paymentForm)
  if (input.paidOn > todayInMexico()) throw new Error('La fecha de pago no puede ser posterior a hoy.')
  if (input.paidOn < formatCfdiDate(invoice.issuedAt).slice(0, 10)) {
    throw new Error('La fecha de pago no puede ser anterior a la factura.')
  }

  // The payment is in the invoice currency; in dollars it needs the rate of the payment day.
  const inPesos = invoice.currency === 'MXN'
  if (!inPesos && !(input.exchangeRate && input.exchangeRate > 0)) {
    throw new Error('Escribe el tipo de cambio del día en que te pagaron.')
  }

  const invoiceTotal = stampedTotal(invoice)
  const taxLines = readInvoiceTaxLines(invoice.xmlContent)
  const now = new Date()

  const reservation = await db.transaction(async (tx) => {
    // Two payments at once must not take the same balance.
    await tx.execute(sql`SELECT ${invoices.id} FROM ${invoices} WHERE ${invoices.id} = ${invoice.id} FOR UPDATE`)

    const applied = await tx
      .select({
        id: payments.id,
        uuid: payments.uuid,
        relatedUuid: payments.relatedUuid,
        amountPaid: paymentDocuments.amountPaid,
        status: payments.status,
        stampingStartedAt: payments.stampingStartedAt,
        cancellationStatus: payments.cancellationStatus,
      })
      .from(paymentDocuments)
      .innerJoin(payments, eq(paymentDocuments.paymentId, payments.id))
      .where(and(eq(paymentDocuments.invoiceId, invoice.id), inArray(payments.status, ACTIVE_STATUSES)))
    const previous = countingPayments(applied).filter((p) => p.id !== replaces?.id)

    // While the SAT decides on cancelling one of them, the balance is not known.
    if (previous.some((p) => p.cancellationStatus === 'en_proceso')) return { kind: 'cancellation_pending' } as const

    // An unconfirmed payment must be settled first, or NumParcialidad could skip a number.
    const pending = previous.find((p) => p.status === 'en_timbrado')
    if (pending) {
      const recent = pending.stampingStartedAt && now.getTime() - pending.stampingStartedAt.getTime() < STAMPING_LOCK_MS
      return { kind: recent ? 'in_progress' : 'unconfirmed_pending' } as const
    }

    const balance = invoiceBalance(invoiceTotal, previous.map((p) => Number(p.amountPaid)))
    const amounts = computePaymentDocument({ invoiceTotal, taxLines, ...balance, amountPaid: input.amount })

    // Folios are allocated one at a time per profile and serie.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`payments:${profile.id}:${PAYMENT_SERIE}`}))`)
    const [{ maxFolio }] = await tx
      .select({ maxFolio: sql<number>`coalesce(max(${payments.folio}), 0)` })
      .from(payments)
      .where(and(eq(payments.issuingProfileId, profile.id), eq(payments.serie, PAYMENT_SERIE)))

    const [payment] = await tx
      .insert(payments)
      .values({
        userId,
        issuingProfileId: profile.id,
        clientId: invoice.clientId,
        serie: PAYMENT_SERIE,
        folio: Number(maxFolio) + 1,
        paidOn: input.paidOn,
        paymentForm: input.paymentForm,
        currency: invoice.currency,
        exchangeRate: inPesos ? null : input.exchangeRate!.toFixed(6),
        amount: amounts.amountPaid.toFixed(2),
        operationNumber: input.operationNumber?.trim() || null,
        status: 'en_timbrado',
        stampingStartedAt: now,
        issuedAt: now,
        relatedUuid: replaces?.uuid ?? null,
      })
      .returning({ id: payments.id })

    await tx.insert(paymentDocuments).values({
      paymentId: payment.id,
      invoiceId: invoice.id,
      installment: amounts.installment,
      previousBalance: amounts.previousBalance.toFixed(2),
      amountPaid: amounts.amountPaid.toFixed(2),
      remainingBalance: amounts.remainingBalance.toFixed(2),
    })

    // Throwing aborts the transaction, so nothing is kept when there is no stamp to reserve.
    if (!(await consumeStamp(userId, tx))) throw new NoStampsError()
    return { kind: 'reserved', paymentId: payment.id } as const
  }).catch((error: unknown) => {
    if (error instanceof NoStampsError) return { kind: 'no_stamps' } as const
    throw error
  })

  switch (reservation.kind) {
    case 'no_stamps':
      return { success: false, code: 'NO_STAMPS', error: 'No tienes timbres disponibles. Compra un paquete para continuar.' }
    case 'in_progress':
      return { success: false, code: 'IN_PROGRESS', error: 'Ya se está registrando un cobro de esta factura. Espera unos segundos y recarga la página.' }
    case 'cancellation_pending':
      return { success: false, code: 'CANCELLATION_PENDING', error: 'Hay una cancelación de cobro en proceso en esta factura. Registra el siguiente cuando el SAT la resuelva.' }
    case 'unconfirmed_pending':
      return { success: false, code: 'UNCONFIRMED_PENDING', error: 'Hay un cobro de esta factura sin confirmar. Reintenta su timbrado antes de registrar otro.' }
    case 'reserved':
      return stampPayment(reservation.paymentId, userId)
  }
}

/**
 * Finishes a payment whose stamping was never confirmed (the PAC did not answer, or the server
 * stopped). Resends the saved sealed XML; when there is none, the PAC never got it.
 */
export async function retryPaymentStamp(paymentId: string, userId: string): Promise<PaymentResult> {
  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.id, paymentId), eq(payments.userId, userId)),
  })
  if (!payment) throw new Error('Cobro no encontrado')
  if (payment.status === 'timbrado' && payment.uuid) return { success: true, paymentId, uuid: payment.uuid }
  if (payment.status !== 'en_timbrado') throw new Error('Este cobro no está pendiente de timbrar')

  const now = new Date()
  if (payment.stampingStartedAt && now.getTime() - payment.stampingStartedAt.getTime() < STAMPING_LOCK_MS) {
    return { success: false, code: 'IN_PROGRESS', error: 'Este cobro ya se está timbrando. Espera unos segundos y recarga la página.' }
  }

  // Claim it; a sealed XML keeps its Fecha, an unsealed one is dated now.
  const claimed = await db
    .update(payments)
    .set({ stampingStartedAt: now, ...(!payment.xmlContent && { issuedAt: now }) })
    .where(and(
      eq(payments.id, paymentId),
      eq(payments.status, 'en_timbrado'),
      or(
        isNull(payments.stampingStartedAt),
        lt(payments.stampingStartedAt, new Date(now.getTime() - STAMPING_LOCK_MS)),
      ),
    ))
    .returning({ id: payments.id })
  if (claimed.length === 0) {
    return { success: false, code: 'IN_PROGRESS', error: 'Este cobro ya se está timbrando. Espera unos segundos y recarga la página.' }
  }

  return stampPayment(paymentId, userId)
}

/** Deletes a payment the PAC never stamped and gives its stamp back. */
async function discardPayment(paymentId: string, userId: string) {
  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.userId, userId), eq(payments.status, 'en_timbrado')))
      .returning({ id: payments.id })
    if (deleted.length > 0) await refundStamp(userId, tx)
  })
}

/**
 * Seals and stamps a reserved payment.
 *
 * The sealed XML is saved before the PAC call. If the answer is lost, resending that same XML
 * makes SW return the stamp it already gave (code 307) instead of stamping twice.
 * - PAC accepts → save the stamp; the XML upload to R2 is best-effort.
 * - PAC rejects → delete the payment and refund the stamp.
 * - No answer → keep it `en_timbrado` for `retryPaymentStamp`.
 */
async function stampPayment(paymentId: string, userId: string): Promise<PaymentResult> {
  const payment = await db.query.payments.findFirst({
    where: and(eq(payments.id, paymentId), eq(payments.userId, userId)),
    with: { client: true, documents: { with: { invoice: true } } },
  })
  if (!payment) throw new Error('Cobro no encontrado')

  let sealedXml = payment.xmlContent
  if (!sealedXml) {
    try {
      const profile = await getIssuingProfileWithSecrets(payment.issuingProfileId, userId)
      if (!profile || !profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')

      const unsignedXml = buildPaymentXml({
        payment: {
          serie: payment.serie,
          folio: payment.folio,
          issuedAt: payment.issuedAt ?? new Date(),
          paidOn: payment.paidOn,
          paymentForm: payment.paymentForm,
          amount: Number(payment.amount),
          operationNumber: payment.operationNumber,
          relatedUuid: payment.relatedUuid,
          currency: payment.currency,
          exchangeRate: payment.exchangeRate ? Number(payment.exchangeRate) : null,
        },
        documents: payment.documents.map((document) => {
          const invoiceXml = document.invoice.xmlContent ?? ''
          return {
            uuid: document.invoice.uuid!,
            serie: document.invoice.serie,
            folio: document.invoice.folio,
            currency: document.invoice.currency,
            amounts: computePaymentDocument({
              invoiceTotal: stampedTotal(document.invoice),
              taxLines: readInvoiceTaxLines(invoiceXml),
              installment: document.installment,
              previousBalance: Number(document.previousBalance),
              amountPaid: Number(document.amountPaid),
            }),
          }
        }),
        profile,
        client: payment.client,
        certificateBase64: profile.cerBase64!,
        certificateNumber: profile.certSerialNumber!,
      })
      sealedXml = sealXml({
        xml: unsignedXml,
        cerBase64: profile.cerBase64!,
        keyBase64: profile.keyBase64!,
        keyPassword: decryptString(profile.keyPassword!),
      })
    } catch (error) {
      // Nothing reached the PAC.
      await discardPayment(paymentId, userId)
      throw error
    }
    await db.update(payments).set({ xmlContent: sealedXml }).where(eq(payments.id, paymentId))
  }

  let result: StampingResult
  try {
    result = await swStamp(sealedXml)
  } catch (error) {
    console.error('[payments] No answer from the PAC; the payment stays unconfirmed:', {
      paymentId,
      error: error instanceof Error ? error.message : error,
    })
    return {
      success: false,
      code: 'UNCONFIRMED',
      error: 'No pudimos confirmar el timbrado con el SAT. Reintenta en unos minutos desde el cobro; no se usará otro timbre.',
    }
  }

  if (!result.success || !result.uuid || !result.cfdi) {
    await discardPayment(paymentId, userId)
    return { success: false, code: 'PAC_REJECTED', error: result.error ?? 'El PAC rechazó el complemento de pago' }
  }

  // The CFDI now exists at the SAT. If saving it fails, the payment stays `en_timbrado` with its
  // sealed XML, and a retry recovers the stamp (307).
  try {
    await db
      .update(payments)
      .set({
        status: 'timbrado',
        uuid: result.uuid,
        xmlContent: result.cfdi,
        satCertificateNumber: result.satCertificateNumber,
        cfdiSignature: result.cfdiSignature,
        satSignature: result.satSignature,
        satOriginalChain: result.satOriginalChain,
        qrCode: result.qrCode ?? null,
        stampedAt: result.stampedAt ? new Date(result.stampedAt) : new Date(),
        stampingStartedAt: null,
      })
      .where(eq(payments.id, paymentId))
  } catch (error) {
    console.error('[payments] Complemento stamped but not saved; retry recovers it:', {
      paymentId,
      uuid: result.uuid,
      error: error instanceof Error ? error.message : error,
    })
    throw new Error(`El complemento se timbró (UUID ${result.uuid}) pero no se pudo guardar. Reintenta desde el cobro.`)
  }

  // XML and PDF to R2 (the download buttons need them), then the email; none of it undoes the stamp.
  const xmlBuffer = Buffer.from(result.cfdi, 'utf-8')
  let pdfBuffer: Buffer | null = null
  try {
    pdfBuffer = await generatePaymentPdf(
      {
        xmlContent: result.cfdi,
        qrCode: result.qrCode ?? null,
        satOriginalChain: result.satOriginalChain ?? null,
        issuingProfileId: payment.issuingProfileId,
      },
      userId,
    )
  } catch (error) {
    console.error('[payments] PDF generation failed (payment is still timbrado):', error)
  }

  try {
    const [xmlKey, pdfKey] = await Promise.all([
      uploadFile(userId, result.uuid, xmlBuffer, 'xml'),
      pdfBuffer ? uploadFile(userId, result.uuid, pdfBuffer, 'pdf') : Promise.resolve(null),
    ])
    await db.update(payments).set({ xmlUrl: xmlKey, pdfUrl: pdfKey }).where(eq(payments.id, paymentId))
  } catch (error) {
    console.error('R2 upload failed (payment is still timbrado):', error)
  }

  const [document] = payment.documents
  if (payment.client.email && pdfBuffer && document) {
    const profile = await getIssuingProfileById(payment.issuingProfileId, userId)
    const remaining = Number(document.remainingBalance)
    sendPaymentEmail({
      to: payment.client.email,
      businessName: profile?.businessName ?? '',
      clientName: payment.client.businessName,
      folioLabel: `${payment.serie}-${payment.folio}`,
      invoiceLabel: `${document.invoice.serie ? `${document.invoice.serie}-` : ''}${document.invoice.folio}`,
      installment: String(document.installment),
      amount: formatCurrency(Number(payment.amount), payment.currency),
      currency: payment.currency,
      remainingBalance: formatCurrency(remaining, payment.currency),
      isPaidOff: remaining <= 0,
      paidOn: formatDay(payment.paidOn),
      uuid: result.uuid,
      xmlBuffer,
      pdfBuffer,
    }).catch((error) => {
      console.error('Email send failed (payment is still timbrado):', error)
    })
  }

  return { success: true, paymentId, uuid: result.uuid }
}

/** "P-2" */
function paymentLabel(payment: { serie: string; folio: number }) {
  return `${payment.serie}-${payment.folio}`
}

/**
 * "Corregir cobro": stamps a complemento that replaces the last one of an invoice (TipoRelacion
 * 04), with its installment and previous balance, then asks the SAT to cancel the old one with
 * motive 01. A failure leaves the old one "por cancelar", to retry from the talón.
 */
export async function correctPayment(userId: string, paymentId: string, input: RegisterPaymentInput): Promise<PaymentResult> {
  const old = await db.query.payments.findFirst({
    where: and(eq(payments.id, paymentId), eq(payments.userId, userId)),
    with: { documents: true },
  })
  if (!old) throw new Error('Cobro no encontrado')
  if (old.status !== 'timbrado' || !old.uuid) throw new Error('Solo se corrigen cobros timbrados.')
  if (old.cancellationStatus === 'en_proceso') throw new Error('Ya pediste cancelar este cobro. Espera la respuesta del SAT.')
  if (old.cancellationSubstituteUuid) throw new Error('Este cobro ya tiene un complemento que lo sustituye.')
  if (old.documents[0]?.invoiceId !== input.invoiceId) throw new Error('El cobro no es de esta factura.')
  const last = await getLastCountingPayment(input.invoiceId, userId)
  if (last?.id !== old.id) throw new Error('Solo se puede corregir el último cobro de la factura.')

  const result = await reserveAndStamp(userId, input, old)
  if (!result.success) return result

  await db.update(payments).set({ cancellationSubstituteUuid: result.uuid }).where(eq(payments.id, old.id))
  const label = paymentLabel(old)
  let replacement: PaymentReplacementOutcome
  try {
    const cancellation = await cancelPayment(old.id, userId, '01', result.uuid)
    replacement = cancellation.success
      ? { paymentId: old.id, label, outcome: cancellation.outcome }
      : { paymentId: old.id, label, outcome: 'por_cancelar', error: cancellation.error }
  } catch (error) {
    replacement = { paymentId: old.id, label, outcome: 'por_cancelar', error: error instanceof Error ? error.message : 'No se pudo pedir la cancelación.' }
  }
  return { ...result, replacement }
}
