import { pgTable, uuid, varchar, text, timestamp, integer, numeric } from 'drizzle-orm/pg-core'
import { clients } from './clients'

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  folio: integer('folio').notNull(),
  serie: varchar('serie', { length: 25 }),
  fechaEmision: timestamp('fecha_emision', { withTimezone: true }).defaultNow().notNull(),
  subtotal: numeric('subtotal', { precision: 15, scale: 2 }).notNull(),
  iva: numeric('iva', { precision: 15, scale: 2 }).notNull().default('0'),
  retenciones: numeric('retenciones', { precision: 15, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  moneda: varchar('moneda', { length: 3 }).notNull().default('MXN'),
  formaPago: varchar('forma_pago', { length: 2 }).notNull(), // 01, 02, 03, etc.
  metodoPago: varchar('metodo_pago', { length: 3 }).notNull(), // PUE, PPD
  usoCfdi: varchar('uso_cfdi', { length: 10 }).notNull(),
  xmlUrl: text('xml_url'),
  pdfUrl: text('pdf_url'),
  uuid: varchar('uuid', { length: 36 }), // Folio Fiscal SAT
  estatus: varchar('estatus', { length: 20 }).notNull().default('draft'), // draft, timbrada, cancelada
  motivoCancelacion: varchar('motivo_cancelacion', { length: 2 }),
  fechaCancelacion: timestamp('fecha_cancelacion', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  claveProdServ: varchar('clave_prod_serv', { length: 8 }).notNull().default('84111506'),
  descripcion: text('descripcion').notNull(),
  cantidad: numeric('cantidad', { precision: 15, scale: 2 }).notNull(),
  unidad: varchar('unidad', { length: 10 }).notNull().default('E48'),
  valorUnitario: numeric('valor_unitario', { precision: 15, scale: 2 }).notNull(),
  importe: numeric('importe', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
