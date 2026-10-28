import { index, numeric, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * "Mis servicios": the concepts a user bills again and again, ready to fill an invoice line.
 * Prices are kept before IVA, as freelancers quote; the invoice form converts them when its
 * prices include IVA.
 */
export const catalogItems = pgTable('catalog_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  description: text('description').notNull(),
  /** ClaveProdServ (8 digits). */
  productServiceCode: varchar('product_service_code', { length: 8 }).notNull(),
  /** ClaveUnidad. */
  unit: varchar('unit', { length: 10 }).notNull().default('E48'),
  /** Unit price before IVA; null when it changes from invoice to invoice. */
  unitPrice: numeric('unit_price', { precision: 15, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('catalog_items_user_idx').on(table.userId),
])

export type CatalogItemRow = typeof catalogItems.$inferSelect
