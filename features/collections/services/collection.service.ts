import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import { invoices } from '@database/schemas/invoices.schema'
import { paymentReminders } from '@database/schemas/payment-reminders.schema'
import { getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getInvoiceById } from '@features/invoicing/services/invoice.service'
import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import { invoiceStampState } from '@features/invoicing/utils/cancellation-state'
import { round2 } from '@features/invoicing/utils/cfdi-amounts'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { sendPaymentReminderEmail } from '@features/notifications/services/email.service'
import { getInvoicePayments, getPaidAmountsByInvoice, stampedTotal } from '@features/payments/services/payment.service'
import { summarizeBalance } from '@features/payments/utils/payment-amounts'
import { formatDay } from '@features/payments/utils/payment-dates'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { generateInvoicePdf } from '@features/storage/services/pdf-generator.service'
import { and, desc, eq, gt, or } from 'drizzle-orm'
import { collectionState, isOwed, type CollectionState } from '../utils/collection-state'

/** A stamped invoice with something still owed on it. */
export interface OwedInvoice {
  id: string
  issuingProfileId: string | null
  serie: string | null
  folio: number
  clientName: string
  currency: string
  state: CollectionState
  /** The balance in pesos, at the exchange rate of the invoice. */
  balancePesos: number
}

export interface OwedSummary {
  /** Everything owed, in pesos. */
  totalPesos: number
  count: number
  overdueCount: number
  overduePesos: number
  /** The first few: overdue ones first, then by due date. */
  invoices: OwedInvoice[]
}

export type ReminderChannel = 'whatsapp' | 'email'

export interface LastReminder {
  channel: ReminderChannel
  /** Sent by the daily cron ("Recordar a mis clientes"), not by the user. */
  automatic: boolean
  createdAt: Date
}

/** One email reminder per invoice a day, at most: the client should not feel spammed. */
const EMAIL_REMINDER_GAP_MS = 24 * 60 * 60 * 1000

/** Overdue first; then by due date (none last); then the oldest. */
function byUrgency(a: OwedInvoice, b: OwedInvoice): number {
  const overdue = Number(b.state.status === 'vencida') - Number(a.state.status === 'vencida')
  if (overdue !== 0) return overdue
  if (a.state.dueDate !== b.state.dueDate) {
    if (a.state.dueDate === null) return 1
    if (b.state.dueDate === null) return -1
    return a.state.dueDate < b.state.dueDate ? -1 : 1
  }
  return a.folio - b.folio
}

/**
 * Every valid invoice with something still owed: PPD ones with a balance after their complementos
 * de pago, and PUE ones the user marked as awaiting payment.
 */
export async function getOwedInvoices(userId: string, today = todayInMexico()): Promise<OwedInvoice[]> {
  const [rows, paidByInvoice] = await Promise.all([
    db
      .select({
        id: invoices.id,
        issuingProfileId: invoices.issuingProfileId,
        serie: invoices.serie,
        folio: invoices.folio,
        total: invoices.total,
        currency: invoices.currency,
        exchangeRate: invoices.exchangeRate,
        paymentMethod: invoices.paymentMethod,
        dueDate: invoices.dueDate,
        awaitingPayment: invoices.awaitingPayment,
        issuedAt: invoices.issuedAt,
        status: invoices.status,
        cancellationStatus: invoices.cancellationStatus,
        cancellationSubstituteUuid: invoices.cancellationSubstituteUuid,
        clientName: clients.businessName,
      })
      .from(invoices)
      .innerJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, 'timbrada'),
        or(eq(invoices.paymentMethod, 'PPD'), eq(invoices.awaitingPayment, true)),
      )),
    getPaidAmountsByInvoice(userId),
  ])

  const owed: OwedInvoice[] = []
  for (const row of rows) {
    const state = collectionState(row, { total: Number(row.total), paid: paidByInvoice[row.id] ?? 0 }, today)
    if (!isOwed(state)) continue
    owed.push({
      id: row.id,
      issuingProfileId: row.issuingProfileId,
      serie: row.serie,
      folio: row.folio,
      clientName: row.clientName,
      currency: row.currency,
      state,
      balancePesos: round2(state.balance * Number(row.exchangeRate ?? 1)),
    })
  }
  return owed.sort(byUrgency)
}

/** "Te deben", for the Inicio. */
export async function getOwedSummary(userId: string, limit = 5): Promise<OwedSummary> {
  const owed = await getOwedInvoices(userId)
  const overdue = owed.filter((invoice) => invoice.state.status === 'vencida')
  return {
    totalPesos: round2(owed.reduce((sum, invoice) => sum + invoice.balancePesos, 0)),
    count: owed.length,
    overdueCount: overdue.length,
    overduePesos: round2(overdue.reduce((sum, invoice) => sum + invoice.balancePesos, 0)),
    invoices: owed.slice(0, limit),
  }
}

/** Where the collection of one invoice stands, with what its complementos de pago collected. */
export async function getInvoiceCollectionState(
  invoice: InvoiceWithRelations,
  userId: string,
  today = todayInMexico(),
): Promise<CollectionState | null> {
  const total = stampedTotal(invoice)
  const paid = invoice.paymentMethod === 'PPD'
    ? summarizeBalance(total, await getInvoicePayments(invoice.id, userId)).paid
    : 0
  return collectionState(invoice, { total, paid }, today)
}

/**
 * "Marcar por cobrar" / "Ya me pagaron" on a PUE invoice. A PPD invoice is collected by
 * registering its payments instead.
 */
export async function setAwaitingPayment(invoiceId: string, userId: string, awaiting: boolean) {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)),
  })
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.paymentMethod !== 'PUE') throw new Error('Una factura PPD se cobra registrando sus cobros.')
  const stampState = invoiceStampState(invoice)
  if (stampState !== 'timbrada' && stampState !== 'cancelacion_rechazada') {
    throw new Error('Solo se marca una factura timbrada que sigue vigente.')
  }

  await db.update(invoices).set({ awaitingPayment: awaiting }).where(eq(invoices.id, invoiceId))
}

/** Notes a reminder on the invoice's history. */
export async function logReminder(invoiceId: string, userId: string, channel: ReminderChannel) {
  const [invoice] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
    .limit(1)
  if (!invoice) throw new Error('Factura no encontrada')

  await db.insert(paymentReminders).values({ userId, invoiceId, channel })
}

export async function getLastReminder(invoiceId: string, userId: string): Promise<LastReminder | null> {
  const [last] = await db
    .select({ channel: paymentReminders.channel, automatic: paymentReminders.automatic, createdAt: paymentReminders.createdAt })
    .from(paymentReminders)
    .where(and(eq(paymentReminders.invoiceId, invoiceId), eq(paymentReminders.userId, userId)))
    .orderBy(desc(paymentReminders.createdAt))
    .limit(1)
  return last ?? null
}

/**
 * "Enviar por correo": the reminder as the user wrote it, with the invoice XML and PDF. Answers go
 * to the issuer's email. At most one a day per invoice. `automatic`: sent by the daily cron.
 */
export async function sendReminderEmail(
  invoiceId: string,
  userId: string,
  message: string,
  options: { automatic?: boolean } = {},
) {
  const invoice = await getInvoiceById(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (!invoice.client.email) throw new Error('Tu cliente no tiene correo. Agrégalo en Clientes.')
  if (!invoice.xmlContent) throw new Error('La factura no tiene su XML timbrado.')

  const state = await getInvoiceCollectionState(invoice, userId)
  if (!isOwed(state)) throw new Error('Esta factura ya no tiene saldo pendiente.')

  const [recent] = await db
    .select({ id: paymentReminders.id })
    .from(paymentReminders)
    .where(and(
      eq(paymentReminders.invoiceId, invoiceId),
      eq(paymentReminders.userId, userId),
      eq(paymentReminders.channel, 'email'),
      gt(paymentReminders.createdAt, new Date(Date.now() - EMAIL_REMINDER_GAP_MS)),
    ))
    .limit(1)
  if (recent) throw new Error('Ya le enviaste un recordatorio por correo en las últimas 24 horas.')

  const profile = invoice.issuingProfileId ? await getIssuingProfileById(invoice.issuingProfileId, userId) : null
  const pdfBuffer = await generateInvoicePdf(invoice, userId)

  await sendPaymentReminderEmail({
    to: invoice.client.email,
    replyTo: profile?.email,
    businessName: profile?.businessName ?? '',
    folioLabel: `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`,
    message,
    balance: formatCurrency(state.balance, invoice.currency),
    currency: invoice.currency,
    dueDate: state.dueDate ? formatDay(state.dueDate) : null,
    overdue: state.status === 'vencida',
    xmlBuffer: Buffer.from(invoice.xmlContent, 'utf-8'),
    pdfBuffer,
  })
  await db.insert(paymentReminders).values({ userId, invoiceId, channel: 'email', automatic: options.automatic ?? false })
  return { to: invoice.client.email }
}
