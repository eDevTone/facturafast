import { relations } from 'drizzle-orm'
import { date, index, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { clients } from './clients.schema'
import { cancellationStatusEnum, invoices } from './invoices.schema'

/**
 * Complemento de pago (CFDI tipo P, Pagos 2.0).
 *
 * `payments` is the `pago20:Pago` node plus the CFDI that carries it; `payment_documents` is each
 * `pago20:DoctoRelacionado` (the invoice the payment settles). They live apart from `invoices`
 * because every invoice query assumes a type I CFDI.
 */

// `en_timbrado` reserves the balance while the PAC call is in flight; a rejected payment is deleted.
export const paymentStatusEnum = pgEnum('payment_status', ['en_timbrado', 'timbrado', 'cancelado'])

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  issuingProfileId: uuid('issuing_profile_id').notNull(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  serie: varchar('serie', { length: 25 }).notNull().default('P'),
  folio: integer('folio').notNull(),
  /** FechaPago: the day the money arrived. The time is set when the XML is built. */
  paidOn: date('paid_on', { mode: 'string' }).notNull(),
  /** FormaDePagoP (c_FormaPago); never 99 "Por definir". */
  paymentForm: varchar('payment_form', { length: 2 }).notNull(),
  /** MonedaP. */
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),
  /** TipoCambioP: pesos per unit of `currency` on the payment day; null in pesos. */
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),
  /** Monto. */
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  /** NumOperacion: transfer reference, check number… */
  operationNumber: varchar('operation_number', { length: 100 }),
  status: paymentStatusEnum('status').notNull().default('en_timbrado'),
  stampingStartedAt: timestamp('stamping_started_at', { withTimezone: true }),
  /** Fecha of the CFDI de pago. */
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  uuid: varchar('uuid', { length: 36 }),
  xmlContent: text('xml_content'),
  xmlUrl: text('xml_url'),
  pdfUrl: text('pdf_url'),
  satCertificateNumber: text('sat_certificate_number'),
  cfdiSignature: text('cfdi_signature'),
  satSignature: text('sat_signature'),
  satOriginalChain: text('sat_original_chain'),
  qrCode: text('qr_code'),
  stampedAt: timestamp('stamped_at', { withTimezone: true }),
  cancellationReason: varchar('cancellation_reason', { length: 2 }),
  cancellationAcuseUrl: text('cancellation_acuse_url'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  /** UUID of the complemento this one replaces (CfdiRelacionados, TipoRelacion 04). */
  relatedUuid: varchar('related_uuid', { length: 36 }),
  /** Pending cancellation request; null when there is none. */
  cancellationStatus: cancellationStatusEnum('cancellation_status'),
  cancellationRequestedAt: timestamp('cancellation_requested_at', { withTimezone: true }),
  /** UUID of the complemento that replaces this one: set when it is stamped, sent as FolioSustitucion. */
  cancellationSubstituteUuid: varchar('cancellation_substitute_uuid', { length: 36 }),
  /** Last answer of the SAT status service: EsCancelable. */
  satCancellable: varchar('sat_cancellable', { length: 40 }),
  /** Last answer of the SAT status service: EstatusCancelacion. */
  satCancellationStatus: varchar('sat_cancellation_status', { length: 40 }),
  satCheckedAt: timestamp('sat_checked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('payments_profile_serie_folio_idx')
    .on(table.issuingProfileId, table.serie, table.folio),
  index('payments_related_uuid_idx').on(table.relatedUuid),
])

export const paymentDocuments = pgTable('payment_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  /** NumParcialidad. */
  installment: integer('installment').notNull(),
  /** ImpSaldoAnt. */
  previousBalance: numeric('previous_balance', { precision: 15, scale: 2 }).notNull(),
  /** ImpPagado. */
  amountPaid: numeric('amount_paid', { precision: 15, scale: 2 }).notNull(),
  /** ImpSaldoInsoluto. */
  remainingBalance: numeric('remaining_balance', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('payment_documents_invoice_idx').on(table.invoiceId),
])

// Relations
export const paymentsRelations = relations(payments, ({ one, many }) => ({
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  documents: many(paymentDocuments),
}))

export const paymentDocumentsRelations = relations(paymentDocuments, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentDocuments.paymentId],
    references: [payments.id],
  }),
  invoice: one(invoices, {
    fields: [paymentDocuments.invoiceId],
    references: [invoices.id],
  }),
}))

export type Payment = typeof payments.$inferSelect
export type PaymentDocument = typeof paymentDocuments.$inferSelect
