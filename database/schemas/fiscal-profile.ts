import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// TODO: Add .references(() => users.id) when auth is implemented (Clerk + webhooks)
export const userFiscalProfile = pgTable('user_fiscal_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(), // Clerk user ID (not UUID)
  rfc: varchar('rfc', { length: 13 }).notNull(),
  businessName: text('business_name').notNull(),
  taxRegime: varchar('tax_regime', { length: 10 }).notNull(),
  postalCode: varchar('postal_code', { length: 5 }).notNull(),
  fiscalAddress: text('fiscal_address'),
  certificateCer: text('certificate_cer'), // Base64 encoded
  certificateKey: text('certificate_key'), // Base64 encoded
  certificatePassword: text('certificate_password'), // Encrypted
  taxCertificateUrl: text('tax_certificate_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
