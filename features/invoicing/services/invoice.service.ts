import { formatDateLong } from '@shared/utils/date'
import { formatDay } from '@features/payments/utils/payment-dates'
import { db } from '@database/client'
import {
  invoiceItems,
  invoices
} from '@database/schemas/invoices.schema'
import { consumeStamp, refundStamp } from '@features/billing/services/account.service'
import { decryptString } from '@features/fiscal-profile/services/certificate.service'
import { getClientById } from '@features/clients/services/client.service'
import { getIssuingProfileById, getIssuingProfileWithSecrets } from '@features/fiscal-profile/services/fiscal-profile.service'
import { isCertExpired, profileHasCSD } from '@features/fiscal-profile/types/fiscal-profile.types'
import { csdExpiredMessage } from '@features/fiscal-profile/utils/csd-expiry'
import { sendInvoiceEmail } from '@features/notifications/services/email.service'
import { hasActivePayments } from '@features/payments/services/payment.service'
import { buildCfdiXml } from '@features/stamping/services/cfdi-xml-builder.service'
import { stampInvoice as swStampInvoice } from '@features/stamping/services/sw-client.service'
import { statusQueryFromCfdi } from '@features/stamping/services/sat-status.service'
import { sealXml } from '@features/stamping/services/xml-seal.service'
import type { StampingResult } from '@features/stamping/types/stamping.types'
import { cancellationDeadline } from '@features/stamping/utils/cancellation'
import { formatCfdiDate, RELATION_SUBSTITUTION, todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { getDofRate } from '@features/exchange-rates/services/exchange-rate.service'
import { dueDateFor, startsAwaitingPayment } from '@features/collections/utils/due-date'
import { paymentDetailLines } from '@features/collections/utils/reminder-message'
import { FOREIGN_CFDI_USAGE, isForeignClient } from '@features/clients/utils/foreign-client'
import { generateInvoicePdf } from '@features/storage/services/pdf-generator.service'
import { uploadFile } from '@features/storage/services/r2.service'
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceRelations,
  InvoiceWithRelations,
  RelatedInvoice,
  ReplacementOutcome
} from '../types/invoice.types'
import { computeCfdiAmounts, IVA_RATE } from '../utils/cfdi-amounts'
import { correctionBlockReason } from '../utils/correction'
import { cancelInvoice } from './cancellation.service'
import { readXmlTotals } from '../utils/invoice-amounts'
import { formatCurrency } from '../utils/invoice-calculations'

/**
 * Get all invoices for a user, ordered by most recent first.
 * Uses relational query to include client and items in a single round-trip.
 */
export async function getInvoices(userId: string): Promise<InvoiceWithRelations[]> {
  return db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: desc(invoices.createdAt),
    with: {
      client: true,
      items: true,
    },
  })
}

/**
 * Get a single invoice by ID, scoped to a user.
 */
export async function getInvoiceById(
  id: string,
  userId: string,
): Promise<InvoiceWithRelations | undefined> {
  return db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.userId, userId)),
    with: {
      client: true,
      items: true,
    },
  })
}

/**
 * Get the next sequential folio for a given profile + serie combination.
 * Must be called inside a transaction to prevent race conditions.
 */
async function getNextFolio(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  profileId: string | null,
  serie: string | null,
): Promise<number> {
  const condition = profileId
    ? serie
      ? sql`${invoices.issuingProfileId} = ${profileId} AND ${invoices.serie} = ${serie}`
      : sql`${invoices.issuingProfileId} = ${profileId} AND ${invoices.serie} IS NULL`
    : serie
      ? sql`${invoices.userId} = ${userId} AND ${invoices.issuingProfileId} IS NULL AND ${invoices.serie} = ${serie}`
      : sql`${invoices.userId} = ${userId} AND ${invoices.issuingProfileId} IS NULL AND ${invoices.serie} IS NULL`

  const [result] = await tx.execute(
    sql`SELECT COALESCE(MAX(${invoices.folio}), 0) AS max_folio FROM ${invoices} WHERE ${condition}`,
  )

  return (Number(result.max_folio) || 0) + 1
}

/**
 * Build the values array for inserting invoice items.
 * `unitPrice` is stored as typed; `amount` is the line total as typed (quantity × unitPrice).
 */
function buildItemsValues(invoiceId: string, items: CreateInvoiceInput['items']) {
  return items.map((item) => ({
    invoiceId,
    productServiceCode: item.productServiceCode,
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit || DEFAULT_UNIT_CODE,
    unitPrice: item.unitPrice.toString(),
    amount: (Math.round(item.quantity * item.unitPrice * 100) / 100).toString(),
  }))
}

/** Totals and tax settings to store on the invoice row, from the shared CFDI calculation. */
function buildTotalsValues(data: CreateInvoiceInput) {
  const amounts = computeCfdiAmounts(data.items, data)
  return {
    pricesIncludeIva: data.pricesIncludeIva,
    ivaRate: String(data.ivaRate ?? IVA_RATE),
    currency: data.currency || 'MXN',
    exchangeRate: data.exchangeRate ? data.exchangeRate.toFixed(6) : null,
    exchangeRateSource: data.exchangeRate ? data.exchangeRateSource ?? 'manual' : null,
    isrWithholdingRate: data.isrWithholdingRate ? data.isrWithholdingRate.toString() : null,
    ivaWithholdingRate: data.ivaWithholdingRate ? data.ivaWithholdingRate.toString() : null,
    subtotal: amounts.subtotal.toString(),
    iva: amounts.iva.toString(),
    withholdings: amounts.withholdings.toString(),
    total: amounts.total.toString(),
  }
}

/** "Unidad de servicio". */
export const DEFAULT_UNIT_CODE = 'E48'

class NoStampsError extends Error {
  constructor() {
    super('No stamps left')
  }
}

/** A stamping attempt older than this is considered dead and can be retried. */
const STAMPING_LOCK_MS = 2 * 60 * 1000

/**
 * The client and the issuing profile of an invoice must belong to the same user. Returns the
 * input as it is stored: a client abroad fixes uso CFDI S01 (CFDI40161) and no withholdings (a
 * foreign client does not withhold); only a client abroad can get IVA 0 %; an invoice in pesos
 * carries no exchange rate.
 */
export async function prepareInvoiceInput(userId: string, data: CreateInvoiceInput): Promise<CreateInvoiceInput> {
  const [client, profile] = await Promise.all([
    getClientById(data.clientId, userId),
    data.issuingProfileId ? getIssuingProfileById(data.issuingProfileId, userId) : Promise.resolve(null),
  ])
  if (!client) throw new Error('Cliente no encontrado')
  if (data.issuingProfileId && !profile) throw new Error('Perfil fiscal no encontrado')

  const inPesos = (data.currency || 'MXN') === 'MXN'
  if (!inPesos && !(data.exchangeRate && data.exchangeRate > 0)) throw new Error('Escribe el tipo de cambio del dólar')
  const input: CreateInvoiceInput = {
    ...data,
    currency: inPesos ? 'MXN' : data.currency,
    exchangeRate: inPesos ? null : data.exchangeRate,
    exchangeRateSource: inPesos ? null : data.exchangeRateSource ?? 'manual',
  }

  if (isForeignClient(client)) {
    return { ...input, cfdiUsage: FOREIGN_CFDI_USAGE, isrWithholdingRate: null, ivaWithholdingRate: null, ivaRate: data.ivaRate ?? IVA_RATE }
  }
  return { ...input, ivaRate: IVA_RATE }
}

/**
 * Create a new invoice (draft) with auto-incremented folio.
 * Folio is unique per issuingProfileId + serie combination.
 */
export async function createInvoice(
  userId: string,
  input: CreateInvoiceInput,
  options: {
    /** CfdiRelacionados; only "Corregir factura" sets it, never the form. */
    relation?: { relationType: string; relatedUuid: string }
    /** The recurring invoice that makes it, and for which month (YYYY-MM). */
    recurring?: { recurringInvoiceId: string; recurringPeriod: string }
  } = {},
) {
  const data = await prepareInvoiceInput(userId, input)
  const serieValue = data.serie || null
  const profileId = data.issuingProfileId || null

  return db.transaction(async (tx) => {
    const nextFolio = await getNextFolio(tx, userId, profileId, serieValue)

    const [invoice] = await tx
      .insert(invoices)
      .values({
        userId,
        clientId: data.clientId,
        issuingProfileId: profileId,
        serie: serieValue,
        paymentForm: data.paymentForm,
        paymentMethod: data.paymentMethod,
        cfdiUsage: data.cfdiUsage,
        paymentTermsDays: data.paymentTermsDays ?? null,
        ...buildTotalsValues(data),
        ...options.relation,
        ...options.recurring,
        status: 'draft',
        folio: nextFolio,
      })
      .returning()

    await tx.insert(invoiceItems).values(buildItemsValues(invoice.id, data.items))

    return invoice
  })
}

/**
 * Update an existing draft invoice.
 * Replaces all items in a single transaction (delete old + insert new).
 */
export async function updateInvoice(
  id: string,
  userId: string,
  input: CreateInvoiceInput,
) {
  const existing = await getInvoiceById(id, userId)
  if (!existing) throw new Error('Factura no encontrada')
  if (existing.status !== 'draft') throw new Error('Solo se pueden editar borradores')
  if (existing.stampingStartedAt) throw new Error('La factura se está timbrando')
  const data = await prepareInvoiceInput(userId, input)

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(invoices)
      .set({
        clientId: data.clientId,
        issuingProfileId: data.issuingProfileId || null,
        serie: data.serie || null,
        paymentForm: data.paymentForm,
        paymentMethod: data.paymentMethod,
        cfdiUsage: data.cfdiUsage,
        paymentTermsDays: data.paymentTermsDays ?? null,
        ...buildTotalsValues(data),
      })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning()

    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id))
    await tx.insert(invoiceItems).values(buildItemsValues(id, data.items))

    return updated
  })
}

/**
 * Delete a draft invoice. Timbrada/cancelada invoices cannot be deleted.
 * Items are cascade-deleted by the DB foreign key constraint.
 */
export async function deleteInvoice(id: string, userId: string) {
  const invoice = await getInvoiceById(id, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'draft') throw new Error('Solo se pueden eliminar borradores')

  await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.userId, userId)))

  return { success: true }
}

/** The input of a new draft that copies an invoice: client, payment data, tax settings and concepts. */
export function copyInvoiceInput(source: InvoiceWithRelations): CreateInvoiceInput {
  return {
    clientId: source.clientId,
    issuingProfileId: source.issuingProfileId ?? undefined,
    serie: source.serie ?? undefined,
    paymentForm: source.paymentForm,
    paymentMethod: source.paymentMethod,
    cfdiUsage: source.cfdiUsage,
    paymentTermsDays: source.paymentTermsDays,
    currency: source.currency,
    exchangeRate: source.exchangeRate ? Number(source.exchangeRate) : null,
    exchangeRateSource: source.exchangeRateSource === 'manual' ? 'manual' : source.exchangeRate ? 'dof' : null,
    ivaRate: Number(source.ivaRate),
    pricesIncludeIva: source.pricesIncludeIva,
    isrWithholdingRate: source.isrWithholdingRate ? Number(source.isrWithholdingRate) : null,
    ivaWithholdingRate: source.ivaWithholdingRate ? Number(source.ivaWithholdingRate) : null,
    items: source.items.map((item) => ({
      productServiceCode: item.productServiceCode,
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
    })),
  }
}

/**
 * Duplicate an invoice as a new draft with the next folio: same client, payment data,
 * tax settings and concepts. Used for monthly retainers.
 */
export async function duplicateInvoice(id: string, userId: string) {
  const source = await getInvoiceById(id, userId)
  if (!source) throw new Error('Factura no encontrada')

  return createInvoice(userId, copyInvoiceInput(source))
}

/** "A-3" */
function folioLabel(invoice: { serie: string | null; folio: number }) {
  return `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
}

/** FormaPago of a PPD invoice: "99 - Por definir". */
const PAYMENT_FORM_TO_BE_DEFINED = '99'

/**
 * "Corregir factura": a draft equal to a stamped invoice that replaces it (CfdiRelacionados with
 * TipoRelacion 04). Stamping it asks the SAT to cancel the original with motive 01. A draft that
 * already corrects the invoice is reused.
 *
 * `toPpd`: a PUE invoice that will not be paid within its month is replaced by a PPD one, with
 * FormaPago 99 (RMF 2026, regla 2.7.1.39).
 */
export async function createCorrectionDraft(invoiceId: string, userId: string, options: { toPpd?: boolean } = {}) {
  const original = await getInvoiceById(invoiceId, userId)
  if (!original) throw new Error('Factura no encontrada')
  if (!original.uuid || !original.xmlContent) throw new Error('Solo se corrigen facturas timbradas.')

  const deadline = cancellationDeadline(original.issuedAt, statusQueryFromCfdi(original.xmlContent).issuerRfc)
  const blocked = correctionBlockReason(original, {
    hasActivePayments: await hasActivePayments(invoiceId, userId),
    deadlineExpired: todayInMexico() > deadline,
  })
  if (blocked) throw new Error(blocked)

  const existing = await db.query.invoices.findFirst({
    where: and(eq(invoices.userId, userId), eq(invoices.status, 'draft'), eq(invoices.relatedUuid, original.uuid)),
  })
  if (existing) {
    if (!options.toPpd || existing.paymentMethod === 'PPD') return existing
    const [updated] = await db
      .update(invoices)
      .set({ paymentMethod: 'PPD', paymentForm: PAYMENT_FORM_TO_BE_DEFINED })
      .where(eq(invoices.id, existing.id))
      .returning()
    return updated
  }

  const input = copyInvoiceInput(original)
  const draft = options.toPpd ? { ...input, paymentMethod: 'PPD', paymentForm: PAYMENT_FORM_TO_BE_DEFINED } : input
  return createInvoice(userId, draft, { relation: { relationType: RELATION_SUBSTITUTION, relatedUuid: original.uuid } })
}

/**
 * The invoice this one replaces, the one that replaces it and a draft that corrects it, for the
 * links on the sheet and the checks before stamping a correction.
 */
export async function getInvoiceRelations(
  invoice: Pick<Invoice, 'uuid' | 'relatedUuid' | 'cancellationSubstituteUuid'>,
  userId: string,
): Promise<InvoiceRelations> {
  const uuids = [invoice.relatedUuid, invoice.cancellationSubstituteUuid].filter((uuid): uuid is string => !!uuid)
  const [rows, drafts] = await Promise.all([
    uuids.length > 0
      ? db
        .select({
          id: invoices.id,
          serie: invoices.serie,
          folio: invoices.folio,
          uuid: invoices.uuid,
          status: invoices.status,
          cancellationStatus: invoices.cancellationStatus,
          xmlContent: invoices.xmlContent,
        })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), inArray(invoices.uuid, uuids)))
      : [],
    invoice.uuid
      ? db
        .select({ id: invoices.id, serie: invoices.serie, folio: invoices.folio })
        .from(invoices)
        .where(and(eq(invoices.userId, userId), eq(invoices.status, 'draft'), eq(invoices.relatedUuid, invoice.uuid)))
        .limit(1)
      : [],
  ])

  const related = (uuid: string | null): RelatedInvoice | undefined => {
    if (!uuid) return undefined
    const row = rows.find((candidate) => candidate.uuid?.toLowerCase() === uuid.toLowerCase())
    if (!row) return { id: null, label: null, uuid, status: null, cancellationStatus: null, receiverRfc: null }
    return {
      id: row.id,
      label: folioLabel(row),
      uuid,
      status: row.status,
      cancellationStatus: row.cancellationStatus,
      receiverRfc: row.xmlContent ? statusQueryFromCfdi(row.xmlContent).receiverRfc : null,
    }
  }

  return {
    replaces: related(invoice.relatedUuid),
    replacedBy: related(invoice.cancellationSubstituteUuid),
    correctionDraft: drafts[0] ? { id: drafts[0].id, label: folioLabel(drafts[0]) } : undefined,
  }
}

/**
 * The stamped invoice a correction draft replaces, and whether stamping it should cancel that one.
 * Throws when the correction cannot be stamped yet.
 */
async function prepareReplacement(draft: InvoiceWithRelations, userId: string) {
  if (draft.relationType !== RELATION_SUBSTITUTION || !draft.relatedUuid) return null
  const original = await db.query.invoices.findFirst({
    where: and(eq(invoices.userId, userId), eq(invoices.uuid, draft.relatedUuid)),
  })
  if (!original) return null

  const label = folioLabel(original)
  if (original.status === 'cancelada') return { original, label, cancel: false }
  if (original.cancellationStatus === 'en_proceso') {
    throw new Error(`La factura ${label} tiene una cancelación en proceso. Espera a que el SAT la resuelva para timbrar su corrección.`)
  }
  // The SAT asks to cancel first with motive 02 when the RFC was wrong (preguntas frecuentes de cancelación 2026, 9).
  const originalRfc = original.xmlContent ? statusQueryFromCfdi(original.xmlContent).receiverRfc : draft.client.rfc
  if (originalRfc !== draft.client.rfc) {
    throw new Error(`Cambiaste el RFC del cliente. Cuando el RFC estaba mal, el SAT pide cancelar primero la ${label} con el motivo 02 y después timbrar la nueva.`)
  }
  if (await hasActivePayments(original.id, userId)) {
    throw new Error(`La factura ${label} tiene complementos de pago vigentes. Cancélalos antes de timbrar su corrección.`)
  }
  return { original, label, cancel: true }
}

/**
 * Stamp an invoice via SW Sapien PAC.
 *
 * Flow:
 * 1. In one transaction, claim the draft (sets `stampingStartedAt` and the CFDI date to now)
 *    and reserve one stamp. A second request for the same invoice, or one without balance,
 *    stops here, so the PAC is never called twice for the same draft.
 * 2. Build, seal and send the XML.
 * 3. PAC rejects → release the claim and refund the stamp.
 *    PAC accepts → save the stamped data. XML/PDF upload and email are best-effort.
 * 4. A correction (TipoRelacion 04) then asks the SAT to cancel the invoice it replaces.
 */
export async function stampInvoice(
  invoiceId: string,
  userId: string,
): Promise<StampingResult & { replacement?: ReplacementOutcome }> {
  const invoice = await getInvoiceById(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'draft') throw new Error('Solo se pueden timbrar borradores')
  if (!invoice.issuingProfileId) throw new Error('La factura no tiene un perfil emisor asignado')

  const profile = await getIssuingProfileWithSecrets(invoice.issuingProfileId, userId)
  if (!profile) throw new Error('Perfil emisor no encontrado')
  if (!profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')
  if (isCertExpired(profile)) {
    return { success: false, code: 'CSD_EXPIRED', fix: 'profile', error: csdExpiredMessage(profile.certValidUntil!) }
  }

  const replacement = await prepareReplacement(invoice, userId)

  // The SAT rejects a CFDI whose Fecha is more than 72 hours old: date it at stamping time.
  const stampingDate = new Date()

  // TipoCambio (CFF art. 20): Banxico's rate for the stamping day, unless the user typed one.
  let exchangeRate = invoice.exchangeRate
  if (invoice.currency !== 'MXN' && invoice.exchangeRateSource !== 'manual') {
    const rate = await getDofRate(invoice.currency, formatCfdiDate(stampingDate).slice(0, 10))
    if (!rate) throw new Error('No pudimos obtener el tipo de cambio del DOF de hoy. Edita el borrador y escríbelo a mano.')
    exchangeRate = rate.toFixed(6)
  }
  if (invoice.currency !== 'MXN' && !exchangeRate) throw new Error('Escribe el tipo de cambio del dólar en el borrador.')

  const claim = await db.transaction(async (tx) => {
    const claimed = await tx
      .update(invoices)
      .set({ stampingStartedAt: stampingDate, issuedAt: stampingDate })
      .where(and(
        eq(invoices.id, invoiceId),
        eq(invoices.userId, userId),
        eq(invoices.status, 'draft'),
        or(
          isNull(invoices.stampingStartedAt),
          lt(invoices.stampingStartedAt, new Date(stampingDate.getTime() - STAMPING_LOCK_MS)),
        ),
      ))
      .returning({ id: invoices.id })

    if (claimed.length === 0) return 'in_progress' as const

    // Throwing aborts the transaction, so the claim is undone when there is no stamp to reserve.
    const reserved = await consumeStamp(userId, tx)
    if (!reserved) throw new NoStampsError()
    return 'claimed' as const
  }).catch((error: unknown) => {
    if (error instanceof NoStampsError) return 'no_stamps' as const
    throw error
  })

  if (claim === 'in_progress') {
    return { success: false, code: 'IN_PROGRESS', error: 'Esta factura ya se está timbrando. Espera unos segundos y recarga la página.' }
  }
  if (claim === 'no_stamps') {
    return { success: false, code: 'NO_STAMPS', error: 'No tienes timbres disponibles. Compra un paquete para continuar.' }
  }

  const releaseClaim = async () => {
    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({ stampingStartedAt: null })
        .where(eq(invoices.id, invoiceId))
      await refundStamp(userId, tx)
    })
  }

  let result: StampingResult
  try {
    const keyPassword = decryptString(profile.keyPassword!)
    const unsignedXml = buildCfdiXml({
      invoice: { ...invoice, issuedAt: stampingDate, exchangeRate },
      profile,
      certificateBase64: profile.cerBase64!,
      certificateNumber: profile.certSerialNumber!,
    })
    const sealedXml = sealXml({
      xml: unsignedXml,
      cerBase64: profile.cerBase64!,
      keyBase64: profile.keyBase64!,
      keyPassword,
    })
    result = await swStampInvoice(sealedXml)
  } catch (error) {
    await releaseClaim()
    throw error
  }

  if (!result.success) {
    await releaseClaim()
    return { ...result, code: 'PAC_REJECTED' }
  }

  // The CFDI now exists at the SAT. If saving it fails, keep the claim set (the draft cannot be
  // stamped again by accident) and log what is needed to recover it by hand.
  // Stored totals are replaced with the stamped ones, so lists and reports match the XML even
  // for drafts saved with an older calculation.
  const stampedTotals = result.cfdi ? readXmlTotals(result.cfdi) : null
  try {
    await db
      .update(invoices)
      .set({
        ...(stampedTotals && {
          subtotal: stampedTotals.subtotal.toFixed(2),
          iva: stampedTotals.iva.toFixed(2),
          withholdings: stampedTotals.withholdings.toFixed(2),
          total: stampedTotals.total.toFixed(2),
        }),
        status: 'timbrada',
        exchangeRate,
        dueDate: dueDateFor(formatCfdiDate(stampingDate).slice(0, 10), invoice.paymentTermsDays),
        awaitingPayment: startsAwaitingPayment(invoice.paymentMethod, invoice.paymentTermsDays),
        uuid: result.uuid,
        xmlContent: result.cfdi,
        satCertificateNumber: result.satCertificateNumber,
        cfdiSignature: result.cfdiSignature,
        satSignature: result.satSignature,
        satOriginalChain: result.satOriginalChain,
        qrCode: result.qrCode,
        stampedAt: result.stampedAt ? new Date(result.stampedAt) : new Date(),
        stampingStartedAt: null,
      })
      .where(eq(invoices.id, invoiceId))
  } catch (error) {
    console.error('[stamping] CFDI stamped but not saved. Recover by hand:', {
      invoiceId,
      uuid: result.uuid,
      error: error instanceof Error ? error.message : error,
    })
    throw new Error(`La factura se timbró (UUID ${result.uuid}) pero no se pudo guardar. Contacta a soporte con este UUID.`)
  }

  // The original knows its replacement from now on, even if asking for its cancellation fails.
  if (replacement?.cancel && result.uuid) {
    await db.update(invoices).set({ cancellationSubstituteUuid: result.uuid }).where(eq(invoices.id, replacement.original.id))
  }

  // Upload XML + PDF to R2 (blocking — needed for download buttons)
  try {
    const stampedInvoice = await getInvoiceById(invoiceId, userId)
    if (stampedInvoice && result.uuid && result.cfdi) {
      const xmlBuffer = Buffer.from(result.cfdi, 'utf-8')
      const pdfBuffer = await generateInvoicePdf(stampedInvoice, userId)

      const [xmlKey, pdfKey] = await Promise.all([
        uploadFile(userId, result.uuid, xmlBuffer, 'xml'),
        uploadFile(userId, result.uuid, pdfBuffer, 'pdf'),
      ])

      await db
        .update(invoices)
        .set({ xmlUrl: xmlKey, pdfUrl: pdfKey })
        .where(eq(invoices.id, invoiceId))

      // Non-blocking: send email after upload completes
      if (stampedInvoice.client.email) {
        sendInvoiceNotification(stampedInvoice, profile, result.uuid, xmlBuffer, pdfBuffer).catch((error) => {
          console.error('Email send failed (invoice is still timbrada):', error)
        })
      }
    }
  } catch (error) {
    console.error('R2 upload failed (invoice is still timbrada):', error)
  }

  if (replacement && result.uuid) {
    return { ...result, replacement: await cancelReplacedInvoice(replacement, result.uuid, userId) }
  }
  return result
}

/**
 * After a correction is stamped, asks the SAT to cancel the invoice it replaces with motive 01.
 * A failure leaves that invoice "por cancelar", to retry from it: the SAT may take a few minutes
 * to know the new invoice.
 */
async function cancelReplacedInvoice(
  replacement: NonNullable<Awaited<ReturnType<typeof prepareReplacement>>>,
  substituteUuid: string,
  userId: string,
): Promise<ReplacementOutcome> {
  const base = { invoiceId: replacement.original.id, label: replacement.label }
  if (!replacement.cancel) return { ...base, outcome: 'ya_cancelada' }

  try {
    const result = await cancelInvoice(replacement.original.id, userId, '01', substituteUuid)
    return result.success ? { ...base, outcome: result.outcome } : { ...base, outcome: 'por_cancelar', error: result.error }
  } catch (error) {
    return { ...base, outcome: 'por_cancelar', error: error instanceof Error ? error.message : 'No se pudo pedir la cancelación.' }
  }
}

/**
 * Send invoice email notification to the receptor.
 * Fire-and-forget — does not block the stamping response.
 */
async function sendInvoiceNotification(
  invoice: InvoiceWithRelations,
  profile: { businessName: string; bankName: string | null; clabe: string | null; paymentLink: string | null },
  uuid: string,
  xmlBuffer: Buffer,
  pdfBuffer: Buffer,
) {
  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  // A paid PUE invoice does not ask to be paid again.
  const owed = invoice.paymentMethod === 'PPD' || invoice.awaitingPayment
  await sendInvoiceEmail({
    to: invoice.client.email!,
    businessName: profile.businessName,
    clientName: invoice.client.businessName,
    folioLabel,
    total: formatCurrency(parseFloat(invoice.total), invoice.currency),
    currency: invoice.currency,
    uuid,
    stampedAt: formatDateLong(new Date()),
    dueDate: owed && invoice.dueDate ? formatDay(invoice.dueDate) : null,
    paymentDetails: owed
      ? paymentDetailLines({ ...profile, holder: profile.businessName })
      : [],
    xmlBuffer,
    pdfBuffer,
  })
}
