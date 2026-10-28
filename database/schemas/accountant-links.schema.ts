import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'

/**
 * "Link para tu contador": a private link that downloads the monthly package of one issuing profile
 * without signing in. The token is found by its SHA-256 and kept encrypted (AES-256-GCM, the key of
 * the CSD passwords) so the user can copy the link again; it never travels in plain text otherwise.
 */
export const accountantLinks = pgTable('accountant_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  issuingProfileId: uuid('issuing_profile_id').notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  tokenEncrypted: text('token_encrypted').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('accountant_links_token_hash_idx').on(table.tokenHash),
  index('accountant_links_profile_idx').on(table.userId, table.issuingProfileId),
])

export type AccountantLink = typeof accountantLinks.$inferSelect
