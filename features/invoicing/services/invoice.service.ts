import { formatDateLong } from '@shared/utils/date'
import { db } from '@database/client'
import {
  invoiceItems,
  invoices
} from '@database/schemas/invoices.schema'
import { checkUsageLimit, incrementStampsUsed } from '@features/billing/services/subscription.service'
import { decryptString } from '@features/fiscal-profile/services/certificate.service'
import { getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { isCertExpired, profileHasCSD } from '@features/fiscal-profile/types/fiscal-profile.types'
import { sendInvoiceEmail } from '@features/notifications/services/email.service'
import { buildCfdiXml } from '@features/stamping/services/cfdi-xml-builder.service'
import { cancelInvoice as swCancelInvoice, stampInvoice as swStampInvoice } from '@features/stamping/services/sw-client.service'
import { sealXml } from '@features/stamping/services/xml-seal.service'
import type { CancellationResult, StampingResult } from '@features/stamping/types/stamping.types'
import { generateInvoicePdf } from '@features/storage/services/pdf-generator.service'
import { uploadFile } from '@features/storage/services/r2.service'
import { and, desc, eq, sql } from 'drizzle-orm'
import type {
  CreateInvoiceInput,
  InvoiceWithRelations
} from '../types/invoice.types'
import { calculateInvoiceTotals, formatCurrency } from '../utils/invoice-calculations'

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
 */
function buildItemsValues(invoiceId: string, items: CreateInvoiceInput['items']) {
  return items.map((item) => ({
    invoiceId,
    productServiceCode: item.productServiceCode || '84111506',
    description: item.description,
    quantity: item.quantity.toString(),
    unit: item.unit || 'E48',
    unitPrice: item.unitPrice.toString(),
    amount: (item.quantity * item.unitPrice).toString(),
  }))
}

/**
 * Create a new invoice (draft) with auto-incremented folio.
 * Folio is unique per issuingProfileId + serie combination.
 */
export async function createInvoice(userId: string, data: CreateInvoiceInput) {
  const { subtotal, iva, total } = calculateInvoiceTotals(data.items)
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
        currency: data.currency || 'MXN',
        subtotal: subtotal.toString(),
        iva: iva.toString(),
        withholdings: '0',
        total: total.toString(),
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
  data: CreateInvoiceInput,
) {
  const existing = await getInvoiceById(id, userId)
  if (!existing) throw new Error('Factura no encontrada')
  if (existing.status !== 'draft') throw new Error('Solo se pueden editar borradores')

  const { subtotal, iva, total } = calculateInvoiceTotals(data.items)

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
        currency: data.currency || 'MXN',
        subtotal: subtotal.toString(),
        iva: iva.toString(),
        total: total.toString(),
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

/**
 * Stamp an invoice via SW Sapien PAC.
 * Flow: validate → build XML → seal → stamp → save → upload R2 → email.
 * R2 upload and email are non-blocking — the invoice is timbrada even if they fail.
 */
export async function stampInvoice(
  invoiceId: string,
  userId: string,
): Promise<StampingResult> {
  const usage = await checkUsageLimit(userId)
  if (!usage.canStamp) {
    return {
      success: false,
      error: `Límite de timbres alcanzado (${usage.used}/${usage.limit}). Actualiza tu plan para continuar.`,
    }
  }

  const invoice = await getInvoiceById(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'draft') throw new Error('Solo se pueden timbrar borradores')
  if (!invoice.issuingProfileId) throw new Error('La factura no tiene un perfil emisor asignado')

  const profile = await getIssuingProfileById(invoice.issuingProfileId, userId)
  if (!profile) throw new Error('Perfil emisor no encontrado')
  if (!profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')
  if (isCertExpired(profile)) throw new Error('El certificado CSD ha expirado')

  const keyPassword = decryptString(profile.keyPassword!)

  const unsignedXml = buildCfdiXml({
    invoice,
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

  const result = await swStampInvoice(sealedXml)
  if (!result.success) return result

  // Persist stamping data
  await db
    .update(invoices)
    .set({
      status: 'timbrada',
      uuid: result.uuid,
      xmlContent: result.cfdi,
      satCertificateNumber: result.satCertificateNumber,
      cfdiSignature: result.cfdiSignature,
      satSignature: result.satSignature,
      satOriginalChain: result.satOriginalChain,
      qrCode: result.qrCode,
      stampedAt: result.stampedAt ? new Date(result.stampedAt) : new Date(),
    })
    .where(eq(invoices.id, invoiceId))

  await incrementStampsUsed(userId)

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

  return result
}

/**
 * Send invoice email notification to the receptor.
 * Fire-and-forget — does not block the stamping response.
 */
async function sendInvoiceNotification(
  invoice: InvoiceWithRelations,
  profile: Awaited<ReturnType<typeof getIssuingProfileById>> & object,
  uuid: string,
  xmlBuffer: Buffer,
  pdfBuffer: Buffer,
) {
  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  await sendInvoiceEmail({
    to: invoice.client.email!,
    businessName: profile.businessName,
    clientName: invoice.client.businessName,
    folioLabel,
    total: formatCurrency(parseFloat(invoice.total)),
    currency: invoice.currency,
    uuid,
    stampedAt: formatDateLong(new Date()),
    xmlBuffer,
    pdfBuffer,
  })
}

/**
 * Cancel a timbrada invoice via SW Sapien PAC.
 * Stores the cancellation acknowledgment (acuse) in R2.
 */
export async function cancelInvoice(
  invoiceId: string,
  userId: string,
  reason: '01' | '02' | '03' | '04',
  replacementUuid?: string,
): Promise<CancellationResult> {
  const invoice = await getInvoiceById(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status !== 'timbrada') throw new Error('Solo se pueden cancelar facturas timbradas')
  if (!invoice.uuid) throw new Error('La factura no tiene UUID fiscal')
  if (!invoice.issuingProfileId) throw new Error('La factura no tiene perfil emisor')

  const profile = await getIssuingProfileById(invoice.issuingProfileId, userId)
  if (!profile) throw new Error('Perfil emisor no encontrado')
  if (!profileHasCSD(profile)) throw new Error('El perfil emisor no tiene certificados CSD configurados')

  const keyPassword = decryptString(profile.keyPassword!)

  const result = await swCancelInvoice({
    uuid: invoice.uuid,
    issuerRfc: profile.rfc,
    reason,
    replacementUuid,
    cerBase64: profile.cerBase64!,
    keyBase64: profile.keyBase64!,
    keyPassword,
  })

  if (!result.success) return result

  await db
    .update(invoices)
    .set({
      status: 'cancelada',
      cancellationReason: reason,
      cancelledAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))

  // Upload acuse to R2 (non-blocking)
  if (result.acknowledgment && invoice.uuid) {
    try {
      const acuseBuffer = Buffer.from(result.acknowledgment, 'utf-8')
      const acuseKey = await uploadFile(userId, `${invoice.uuid}-acuse`, acuseBuffer, 'xml')

      await db
        .update(invoices)
        .set({ cancellationAcuseUrl: acuseKey })
        .where(eq(invoices.id, invoiceId))
    } catch (error) {
      console.error('R2 acuse upload failed (invoice is still cancelada):', error)
    }
  }

  return result
}
