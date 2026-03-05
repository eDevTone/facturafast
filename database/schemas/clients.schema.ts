import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  rfc: varchar('rfc', { length: 13 }).notNull(),
  businessName: text('business_name').notNull(),
  email: text('email'),
  phone: varchar('phone', { length: 20 }),
  postalCode: varchar('postal_code', { length: 5 }).notNull(),
  taxRegime: varchar('tax_regime', { length: 10 }),
  cfdiUsage: varchar('cfdi_usage', { length: 10 }).notNull().default('P01'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations will be defined in invoices.schema.ts
