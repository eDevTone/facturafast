import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import { invoices } from '@database/schemas/invoices.schema'
import { paymentDocuments, payments } from '@database/schemas/payments.schema'
import { collectionState } from '@features/collections/utils/collection-state'
import { getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { round2 } from '@features/invoicing/utils/cfdi-amounts'
import { invoiceAmounts } from '@features/invoicing/utils/invoice-amounts'
import { getPaidAmountsByInvoice, stampedTotal } from '@features/payments/services/payment.service'
import { formatCfdiDate, todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { generateInvoicePdf, generatePaymentPdf } from '@features/storage/services/pdf-generator.service'
import { getDownloadSignedUrl, getFileBuffer, uploadRawFile } from '@features/storage/services/r2.service'
import { and, asc, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { strToU8, zipSync } from 'fflate'
import { toCsv, type CsvValue } from '../utils/csv'
import { monthLabel, monthRange } from '../utils/month'

/**
 * "Paquete para tu contador": the CFDI of one issuing profile stamped in a month (Mexico City),
 * cancelled ones included, as XML and PDF, with a CSV summary.
 */

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

const CSV_HEADER = [
  'Tipo', 'Serie y folio', 'Fecha de timbrado', 'UUID', 'RFC del cliente', 'Cliente',
  'Subtotal', 'IVA trasladado', 'ISR retenido', 'IVA retenido', 'Total',
  'Moneda', 'Tipo de cambio', 'Total en pesos', 'Método de pago', 'Forma de pago',
  'Estatus', 'Cobrado', 'Saldo', 'UUID relacionado',
]

/** PDFs that are not stored are rendered; this many at a time. */
const LOAD_CONCURRENCY = 4

interface PackageFile {
  path: string
  load: () => Promise<Uint8Array>
}

interface MonthPackage {
  profile: { id: string; rfc: string; businessName: string }
  csv: string
  files: PackageFile[]
  documents: number
}

export interface MonthCount {
  month: string
  /** "Octubre de 2026" */
  label: string
  documents: number
}

/** "A-12" */
function folioLabel(serie: string | null, folio: number): string {
  return `${serie ? `${serie}-` : ''}${folio}`
}

/** File names without accents or spaces, so they open the same everywhere: "A-12_EKU9003173C9". */
function fileStem(label: string, rfc: string): string {
  return `${label}_${rfc}`.replace(/[^A-Za-z0-9_-]/g, '')
}

/** "2026-10-19 11:42:05", Mexico City. */
function stampDate(date: Date | null): string | null {
  return date ? formatCfdiDate(date).replace('T', ' ') : null
}

/** The stored file, or `fallback` when there is none or it cannot be read. */
async function storedOr(key: string | null, fallback: () => Promise<Buffer>): Promise<Uint8Array> {
  if (key) {
    try {
      return await getFileBuffer(key)
    } catch {
      // Not in storage: render it again.
    }
  }
  return fallback()
}

async function profileOf(userId: string, profileId: string) {
  const profile = await getIssuingProfileById(profileId, userId)
  if (!profile) throw new Error('Perfil fiscal no encontrado')
  return { id: profile.id, rfc: profile.rfc, businessName: profile.businessName }
}

async function loadMonthPackage(userId: string, profileId: string, month: string): Promise<MonthPackage> {
  if (!MONTH_PATTERN.test(month)) throw new Error('Elige un mes.')
  const profile = await profileOf(userId, profileId)
  const { from, to } = monthRange(month)
  const today = todayInMexico()

  const [monthInvoices, monthPayments, paidByInvoice] = await Promise.all([
    db.query.invoices.findMany({
      where: and(
        eq(invoices.userId, userId),
        eq(invoices.issuingProfileId, profileId),
        inArray(invoices.status, ['timbrada', 'cancelada']),
        gte(invoices.stampedAt, from),
        lt(invoices.stampedAt, to),
      ),
      with: { client: true, items: true },
      orderBy: asc(invoices.stampedAt),
    }),
    db
      .select({ payment: payments, clientRfc: clients.rfc, clientName: clients.businessName })
      .from(payments)
      .innerJoin(clients, eq(clients.id, payments.clientId))
      .where(and(
        eq(payments.userId, userId),
        eq(payments.issuingProfileId, profileId),
        inArray(payments.status, ['timbrado', 'cancelado']),
        gte(payments.stampedAt, from),
        lt(payments.stampedAt, to),
      ))
      .orderBy(asc(payments.stampedAt)),
    getPaidAmountsByInvoice(userId),
  ])

  // The invoices each complemento pays, for "UUID relacionado".
  const paidInvoices = monthPayments.length === 0
    ? []
    : await db
        .select({ paymentId: paymentDocuments.paymentId, uuid: invoices.uuid })
        .from(paymentDocuments)
        .innerJoin(invoices, eq(invoices.id, paymentDocuments.invoiceId))
        .where(inArray(paymentDocuments.paymentId, monthPayments.map(({ payment }) => payment.id)))

  const rows: CsvValue[][] = [CSV_HEADER]
  const files: PackageFile[] = []

  for (const invoice of monthInvoices) {
    const label = folioLabel(invoice.serie, invoice.folio)
    const stem = fileStem(label, invoice.client.rfc)
    const amounts = invoiceAmounts(invoice)
    const rate = invoice.exchangeRate ? Number(invoice.exchangeRate) : null
    const state = collectionState(invoice, { total: stampedTotal(invoice), paid: paidByInvoice[invoice.id] ?? 0 }, today)
    rows.push([
      'Factura', label, stampDate(invoice.stampedAt), invoice.uuid, invoice.client.rfc, invoice.client.businessName,
      amounts.subtotal, amounts.iva, amounts.isrWithheld, amounts.ivaWithheld, amounts.total,
      invoice.currency, rate === null ? null : String(rate), round2(amounts.total * (rate ?? 1)),
      invoice.paymentMethod, invoice.paymentForm,
      invoice.status === 'cancelada' ? 'Cancelada' : 'Vigente',
      state ? round2(state.paid) : null, state ? state.balance : null,
      invoice.relatedUuid,
    ])

    const xmlContent = invoice.xmlContent
    if (xmlContent || invoice.xmlUrl) {
      files.push({
        path: `facturas/${stem}.xml`,
        load: () => xmlContent ? Promise.resolve(strToU8(xmlContent)) : getFileBuffer(invoice.xmlUrl!),
      })
    }
    files.push({ path: `facturas/${stem}.pdf`, load: () => storedOr(invoice.pdfUrl, () => generateInvoicePdf(invoice, userId)) })
    if (invoice.cancellationAcuseUrl) {
      const acuse = invoice.cancellationAcuseUrl
      files.push({ path: `cancelaciones/${stem}_acuse.xml`, load: () => getFileBuffer(acuse) })
    }
  }

  for (const { payment, clientRfc, clientName } of monthPayments) {
    const label = folioLabel(payment.serie, payment.folio)
    const stem = fileStem(label, clientRfc)
    const amount = Number(payment.amount)
    const rate = payment.exchangeRate ? Number(payment.exchangeRate) : null
    const related = paidInvoices.filter((document) => document.paymentId === payment.id).map((document) => document.uuid)
    rows.push([
      'Complemento de pago', label, stampDate(payment.stampedAt), payment.uuid, clientRfc, clientName,
      null, null, null, null, amount,
      payment.currency, rate === null ? null : String(rate), round2(amount * (rate ?? 1)),
      null, payment.paymentForm,
      payment.status === 'cancelado' ? 'Cancelado' : 'Vigente',
      null, null,
      related.filter(Boolean).join(' '),
    ])

    const xmlContent = payment.xmlContent
    if (xmlContent) {
      files.push({ path: `complementos/${stem}.xml`, load: () => Promise.resolve(strToU8(xmlContent)) })
      files.push({
        path: `complementos/${stem}.pdf`,
        load: () => storedOr(payment.pdfUrl, () => generatePaymentPdf({ ...payment, xmlContent }, userId)),
      })
    }
    if (payment.cancellationAcuseUrl) {
      const acuse = payment.cancellationAcuseUrl
      files.push({ path: `cancelaciones/${stem}_acuse.xml`, load: () => getFileBuffer(acuse) })
    }
  }

  return { profile, csv: toCsv(rows), files, documents: monthInvoices.length + monthPayments.length }
}

/** Loads the files a few at a time; the ones that fail are listed instead of stopping the package. */
async function loadFiles(files: PackageFile[]) {
  const loaded: Record<string, Uint8Array> = {}
  const missing: string[] = []
  for (let start = 0; start < files.length; start += LOAD_CONCURRENCY) {
    await Promise.all(files.slice(start, start + LOAD_CONCURRENCY).map(async (file) => {
      try {
        loaded[file.path] = await file.load()
      } catch (error) {
        console.error('[Package] Could not add', file.path, error instanceof Error ? error.message : error)
        missing.push(file.path)
      }
    }))
  }
  return { loaded, missing }
}

/**
 * The month's ZIP, kept in R2 (replaced on every download) and handed out with a signed URL that
 * lasts 10 minutes, like the XML and PDF downloads.
 */
export async function createMonthZip(userId: string, profileId: string, month: string) {
  const pkg = await loadMonthPackage(userId, profileId, month)
  const { loaded, missing } = await loadFiles(pkg.files)
  const entries: Record<string, Uint8Array> = { [`resumen-${month}.csv`]: strToU8(pkg.csv), ...loaded }
  if (missing.length > 0) {
    entries['LEEME.txt'] = strToU8(
      `No pudimos agregar estos archivos; bájalos desde FacturaFast o vuelve a intentarlo:\r\n${missing.join('\r\n')}\r\n`,
    )
  }

  const key = `exports/${userId}/${profileId}/${month}.zip`
  await uploadRawFile(key, Buffer.from(zipSync(entries, { level: 6 })), 'application/zip')
  const filename = `${pkg.profile.rfc}-${month}.zip`
  return { url: await getDownloadSignedUrl(key, filename), filename, documents: pkg.documents, missing: missing.length }
}

/** Only the summary, for a quick look. */
export async function getMonthCsv(userId: string, profileId: string, month: string) {
  const pkg = await loadMonthPackage(userId, profileId, month)
  return { csv: pkg.csv, filename: `resumen-${pkg.profile.rfc}-${month}.csv`, documents: pkg.documents }
}

/** How many CFDI each month has (Mexico City months), for the month pickers. */
export async function getMonthCounts(userId: string, profileId: string): Promise<Map<string, number>> {
  const monthExpr = (column: typeof invoices.stampedAt | typeof payments.stampedAt) =>
    sql<string>`to_char(${column} at time zone 'America/Mexico_City', 'YYYY-MM')`
  const [invoiceRows, paymentRows] = await Promise.all([
    db
      .select({ month: monthExpr(invoices.stampedAt), documents: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.issuingProfileId, profileId), inArray(invoices.status, ['timbrada', 'cancelada'])))
      .groupBy(monthExpr(invoices.stampedAt)),
    db
      .select({ month: monthExpr(payments.stampedAt), documents: sql<number>`count(*)::int` })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.issuingProfileId, profileId), inArray(payments.status, ['timbrado', 'cancelado'])))
      .groupBy(monthExpr(payments.stampedAt)),
  ])
  const counts = new Map<string, number>()
  for (const row of [...invoiceRows, ...paymentRows]) {
    if (row.month) counts.set(row.month, (counts.get(row.month) ?? 0) + row.documents)
  }
  return counts
}

/** Months with their document counts, newest first. */
export function withCounts(months: string[], counts: Map<string, number>): MonthCount[] {
  return months.map((month) => ({ month, label: monthLabel(month), documents: counts.get(month) ?? 0 }))
}

export { profileOf as getPackageProfile }
