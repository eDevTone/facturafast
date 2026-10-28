import { relations } from 'drizzle-orm'
import { boolean, date, index, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { clients } from './clients.schema'
import { recurringInvoices } from './recurring-invoices.schema'

// Enum for invoice status
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'timbrada', 'cancelada'])

/**
 * A cancellation request the SAT has not resolved yet. The CFDI stays `timbrada` (it is still valid)
 * until the SAT reports it cancelled; `rechazada` means the last request ended without cancelling it.
 */
export const cancellationStatusEnum = pgEnum('cancellation_status', ['en_proceso', 'rechazada'])

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  issuingProfileId: uuid('issuing_profile_id'),
  folio: integer('folio').notNull(),
  serie: varchar('serie', { length: 25 }),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  iva: numeric('iva', { precision: 15, scale: 2 }).notNull().default('0'),
  withholdings: numeric('withholdings', { precision: 15, scale: 2 }).notNull().default('0'),
  /** Unit prices were typed with IVA included (older invoices) or before IVA. */
  pricesIncludeIva: boolean('prices_include_iva').notNull().default(true),
  /** TasaOCuota of the ISR withheld (e.g. 0.012500 RESICO); null = none. */
  isrWithholdingRate: numeric('isr_withholding_rate', { precision: 8, scale: 6 }),
  /** TasaOCuota of the IVA withheld (e.g. 0.106667); null = none. */
  ivaWithholdingRate: numeric('iva_withholding_rate', { precision: 8, scale: 6 }),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),
  /** TipoCambio: pesos per unit of `currency`; null for invoices in pesos. */
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),
  /** 'dof': taken from Banxico for the stamping day; 'manual': typed by the user, kept as is. */
  exchangeRateSource: varchar('exchange_rate_source', { length: 10 }),
  /** IVA rate of the invoice: 0.16, or 0 for exported services (LIVA art. 29). */
  ivaRate: numeric('iva_rate', { precision: 8, scale: 6 }).notNull().default('0.16'),
  paymentForm: varchar('payment_form', { length: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 3 }).notNull(),
  cfdiUsage: varchar('cfdi_usage', { length: 10 }).notNull(),
  xmlUrl: text('xml_url'),
  xmlContent: text('xml_content'),
  pdfUrl: text('pdf_url'),
  uuid: varchar('uuid', { length: 36 }),
  satCertificateNumber: text('sat_certificate_number'),
  cfdiSignature: text('cfdi_signature'),
  satSignature: text('sat_signature'),
  satOriginalChain: text('sat_original_chain'),
  qrCode: text('qr_code'),
  stampedAt: timestamp('stamped_at', { withTimezone: true }),
  /** Set while a stamping request is in flight; guards against stamping twice. */
  stampingStartedAt: timestamp('stamping_started_at', { withTimezone: true }),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  cancellationReason: varchar('cancellation_reason', { length: 2 }),
  cancellationAcuseUrl: text('cancellation_acuse_url'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  /** c_TipoRelacion of the CfdiRelacionados node: '04' when this invoice replaces another one. */
  relationType: varchar('relation_type', { length: 2 }),
  /** UUID of the related CFDI (the invoice this one replaces). */
  relatedUuid: varchar('related_uuid', { length: 36 }),
  /** Pending cancellation request; null when there is none. */
  cancellationStatus: cancellationStatusEnum('cancellation_status'),
  cancellationRequestedAt: timestamp('cancellation_requested_at', { withTimezone: true }),
  /** UUID of the invoice that replaces this one: set when it is stamped, sent as FolioSustitucion. */
  cancellationSubstituteUuid: varchar('cancellation_substitute_uuid', { length: 36 }),
  /** Last answer of the SAT status service: EsCancelable. */
  satCancellable: varchar('sat_cancellable', { length: 40 }),
  /** Last answer of the SAT status service: EstatusCancelacion. */
  satCancellationStatus: varchar('sat_cancellation_status', { length: 40 }),
  satCheckedAt: timestamp('sat_checked_at', { withTimezone: true }),
  /** "Días de crédito" of this invoice, taken from the client; null: no due date. */
  paymentTermsDays: integer('payment_terms_days'),
  /** Day the payment is due (Mexico City): the stamping day plus `paymentTermsDays`, set when stamped. */
  dueDate: date('due_date', { mode: 'string' }),
  /** Only PUE: the user has not been paid yet (a PPD invoice knows it from its payments). */
  awaitingPayment: boolean('awaiting_payment').notNull().default(false),
  /** The recurring invoice ("Repetir cada mes") that made this one. */
  recurringInvoiceId: uuid('recurring_invoice_id').references(() => recurringInvoices.id, { onDelete: 'set null' }),
  /** Month it was made for, YYYY-MM: one invoice per recurring invoice and month. */
  recurringPeriod: varchar('recurring_period', { length: 7 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('invoices_profile_serie_folio_idx')
    .on(table.issuingProfileId, table.serie, table.folio),
  index('invoices_related_uuid_idx').on(table.relatedUuid),
  uniqueIndex('invoices_recurring_period_idx').on(table.recurringInvoiceId, table.recurringPeriod),
])

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productServiceCode: varchar('product_service_code', { length: 8 }).notNull().default('84111506'),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 15, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 10 }).notNull().default('E48'),
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id]
  }),
  items: many(invoiceItems)
}))

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id]
  })
}))
