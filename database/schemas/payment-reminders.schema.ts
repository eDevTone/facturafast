import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { invoices } from './invoices.schema'

export const reminderChannelEnum = pgEnum('reminder_channel', ['whatsapp', 'email'])

/**
 * "Recordar pago": each reminder of an invoice. A WhatsApp one is noted when the user opens the
 * chat (the app cannot know whether the message was sent); an email one, once it is sent.
 */
export const paymentReminders = pgTable('payment_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  channel: reminderChannelEnum('channel').notNull(),
  /** Sent by the daily cron, not by the user. */
  automatic: boolean('automatic').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('payment_reminders_invoice_idx').on(table.invoiceId),
])

export type PaymentReminder = typeof paymentReminders.$inferSelect
