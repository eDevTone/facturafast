import { date, numeric, pgTable, primaryKey, timestamp, varchar } from 'drizzle-orm/pg-core'

/**
 * Cache of Banxico's series SF60653: for each day, the exchange rate the CFF (art. 20) asks for,
 * the one published in the DOF on the previous banking day.
 */
export const exchangeRates = pgTable('exchange_rates', {
  currency: varchar('currency', { length: 3 }).notNull(),
  day: date('day', { mode: 'string' }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.currency, table.day] }),
])
