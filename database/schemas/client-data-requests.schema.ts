import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { clients } from './clients.schema'

export const clientRequestStatusEnum = pgEnum('client_request_status', ['pendiente', 'completada', 'cancelada'])

/**
 * "Pedir datos a un cliente": a link the client opens to type their own fiscal data. One use, 30
 * days. The token is found by its SHA-256 and kept encrypted so the user can copy the link again.
 */
export const clientDataRequests = pgTable('client_data_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  /** The business that asks: its name is the only thing the page shows. */
  issuingProfileId: uuid('issuing_profile_id').notNull(),
  /** The client to update; null asks for a new client. */
  clientId: uuid('client_id').references(() => clients.id),
  /** How the user calls this client: "Kemper". */
  label: varchar('label', { length: 120 }).notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  tokenEncrypted: text('token_encrypted').notNull(),
  status: clientRequestStatusEnum('status').notNull().default('pendiente'),
  /** Constancias read and forms sent through the link; it stops working past a limit. */
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('client_data_requests_token_hash_idx').on(table.tokenHash),
  index('client_data_requests_user_idx').on(table.userId, table.status),
])

export type ClientDataRequest = typeof clientDataRequests.$inferSelect
