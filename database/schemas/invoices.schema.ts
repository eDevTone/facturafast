import { pgTable, uuid, varchar, text, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { clients } from './clients.schema'

// Enum for invoice status
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'timbrada', 'cancelada'])

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
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),
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
  status: invoiceStatusEnum('status').notNull().default('draft'),
  cancellationReason: varchar('cancellation_reason', { length: 2 }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

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
