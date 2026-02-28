import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const userFiscalProfile = pgTable('user_fiscal_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => /* auth.users - handled by Supabase Auth */),
  rfc: varchar('rfc', { length: 13 }).notNull(),
  razonSocial: text('razon_social').notNull(),
  regimenFiscal: varchar('regimen_fiscal', { length: 10 }).notNull(),
  codigoPostal: varchar('codigo_postal', { length: 5 }).notNull(),
  direccionFiscal: text('direccion_fiscal'),
  certificadoCer: text('certificado_cer'), // Base64 encoded
  certificadoKey: text('certificado_key'), // Base64 encoded
  certificadoPassword: text('certificado_password'), // Encrypted
  constanciaFiscalUrl: text('constancia_fiscal_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
