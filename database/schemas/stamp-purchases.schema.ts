import { pgTable, uuid, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core'

export const stampPurchases = pgTable('stamp_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  packageId: text('package_id').notNull(),
  stampsAdded: integer('stamps_added').notNull(),
  amountMxn: integer('amount_mxn').notNull(), // en centavos
  paymentProvider: text('payment_provider').notNull().default('conekta'),
  conektaOrderId: text('conekta_order_id'),
  stripeSessionId: text('stripe_session_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  // One credit per paid order: webhook retries can never add the stamps twice.
  uniqueIndex('stamp_purchases_conekta_order_idx').on(table.conektaOrderId),
  uniqueIndex('stamp_purchases_stripe_session_idx').on(table.stripeSessionId),
])
