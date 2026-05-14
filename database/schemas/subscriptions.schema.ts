import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core'

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  conektaCustomerId: text('conekta_customer_id'),
  stripeCustomerId: text('stripe_customer_id'),
  stampsBalance: integer('stamps_balance').notNull().default(3), // 3 timbres de bienvenida
  totalStampsPurchased: integer('total_stamps_purchased').notNull().default(0),
  totalStampsUsed: integer('total_stamps_used').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
