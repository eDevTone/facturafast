import { createHash, randomBytes } from 'node:crypto'
import { decryptString, encryptString } from '@features/fiscal-profile/services/certificate.service'

/**
 * Tokens of links shared outside the app (the accountant's, a client's): 32 random bytes in
 * base64url. The database finds one by its SHA-256 and keeps it encrypted, so the user can copy
 * the link again; a stolen copy of the database does not open the links.
 */

/** SHA-256 (hex) of a token, as stored to find it. */
export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function newShareToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashShareToken(token), tokenEncrypted: encryptString(token) }
}

export function revealShareToken(tokenEncrypted: string): string {
  return decryptString(tokenEncrypted)
}

/** Only something shaped like a token (43 base64url characters) is looked up. */
export function isShareToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value)
}
