import { boolean, date, index, jsonb, pgEnum, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { clients } from './clients.schema'

/** "Dejar borrador y avisarme" or "Timbrar y mandar al cliente". */
export const recurringModeEnum = pgEnum('recurring_mode', ['draft', 'stamp'])

/**
 * What a recurring invoice copies every month: the input of a new invoice (`CreateInvoiceInput`).
 * Descriptions may carry `{mes}`, `{Mes}` and `{año}`, filled with the month each invoice is for.
 */
export interface RecurringInvoiceTemplate {
  clientId: string
  issuingProfileId?: string
  serie?: string
  paymentForm: string
  paymentMethod: string
  cfdiUsage: string
  currency?: string
  exchangeRate?: number | null
  exchangeRateSource?: 'dof' | 'manual' | null
  ivaRate?: number
  paymentTermsDays?: number | null
  pricesIncludeIva: boolean
  isrWithholdingRate: number | null
  ivaWithholdingRate: number | null
  items: { productServiceCode: string; description: string; quantity: number; unit?: string; unitPrice: number }[]
}

/**
 * "Repetir cada mes" (an iguala): a template and the day of the month the app makes the invoice.
 * A daily cron creates it, as a draft or stamped and sent, and moves `nextRunOn` to the next month.
 */
export const recurringInvoices = pgTable('recurring_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  issuingProfileId: uuid('issuing_profile_id').notNull(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  /** The invoice it was made from; only shown, so it is not a foreign key. */
  sourceInvoiceId: uuid('source_invoice_id'),
  template: jsonb('template').$type<RecurringInvoiceTemplate>().notNull(),
  /** 1–31; 31 means the last day, so a short month runs on its last day. */
  dayOfMonth: smallint('day_of_month').notNull(),
  mode: recurringModeEnum('mode').notNull().default('draft'),
  /** Month the descriptions name: −1 the one before the invoice's, 0 its own, 1 the one after. */
  periodOffset: smallint('period_offset').notNull().default(0),
  /** Mexico City days. */
  nextRunOn: date('next_run_on', { mode: 'string' }).notNull(),
  /** Due day of the last month made (today's day when that run was more than a week late). */
  lastRunOn: date('last_run_on', { mode: 'string' }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('recurring_invoices_user_idx').on(table.userId),
  index('recurring_invoices_due_idx').on(table.active, table.nextRunOn),
])

export type RecurringInvoice = typeof recurringInvoices.$inferSelect
