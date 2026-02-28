import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  rfc: varchar('rfc', { length: 13 }).notNull(),
  razonSocial: text('razon_social').notNull(),
  email: text('email'),
  telefono: varchar('telefono', { length: 20 }),
  codigoPostal: varchar('codigo_postal', { length: 5 }).notNull(),
  regimenFiscal: varchar('regimen_fiscal', { length: 10 }),
  usoCfdi: varchar('uso_cfdi', { length: 10 }).notNull().default('P01'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// Relations will be defined in invoices.schema.ts
