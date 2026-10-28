import { integer, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  rfc: varchar('rfc', { length: 13 }).notNull(),
  businessName: text('business_name').notNull(),
  email: text('email'),
  phone: varchar('phone', { length: 20 }),
  /** Mexican fiscal postal code; null for a client abroad, whose CFDI takes the issuer's. */
  postalCode: varchar('postal_code', { length: 5 }),
  taxRegime: varchar('tax_regime', { length: 10 }),
  cfdiUsage: varchar('cfdi_usage', { length: 10 }).notNull().default('G03'),
  /** ResidenciaFiscal (c_Pais) of a client abroad (RFC XEXX010101000); null for a Mexican client. */
  country: varchar('country', { length: 3 }),
  /** NumRegIdTrib: the tax id of a client abroad in its country. */
  foreignTaxId: varchar('foreign_tax_id', { length: 40 }),
  /** IVA charged to this client (0 for exported services, 0.16); proposed on each invoice. */
  ivaRate: numeric('iva_rate', { precision: 8, scale: 6 }),
  /** "Días de crédito": days the client takes to pay; proposed on each invoice. Null: no term. */
  paymentTermsDays: integer('payment_terms_days'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// Relations will be defined in invoices.schema.ts
