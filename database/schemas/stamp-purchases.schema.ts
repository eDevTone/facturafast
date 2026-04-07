import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const stampPurchases = pgTable('stamp_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  packageId: text('package_id').notNull(),
  stampsAdded: integer('stamps_added').notNull(),
  amountMxn: integer('amount_mxn').notNull(), // en centavos
  conektaOrderId: text('conekta_order_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
