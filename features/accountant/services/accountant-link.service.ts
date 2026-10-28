import { db } from '@database/client'
import { accountantLinks } from '@database/schemas/accountant-links.schema'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'
import { appUrl } from '@shared/utils/app-url'
import { hashShareToken, isShareToken, newShareToken, revealShareToken } from '@shared/utils/share-token'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { getPackageProfile } from './month-package.service'

/** The accountant's link as the user sees it. */
export interface AccountantLinkView {
  url: string
  createdAt: Date
  lastUsedAt: Date | null
}

/** "Last used" is noted at most once every this many minutes, not on every click. */
const USE_NOTE_MINUTES = 10

function linkUrl(token: string): string {
  return appUrl(`/contador/${token}`)
}

/** The link of a profile that still works, if there is one. */
export async function getAccountantLink(userId: string, profileId: string): Promise<AccountantLinkView | null> {
  const [link] = await db
    .select()
    .from(accountantLinks)
    .where(and(eq(accountantLinks.userId, userId), eq(accountantLinks.issuingProfileId, profileId), isNull(accountantLinks.revokedAt)))
    .orderBy(desc(accountantLinks.createdAt))
    .limit(1)
  if (!link) return null
  return { url: linkUrl(revealShareToken(link.tokenEncrypted)), createdAt: link.createdAt, lastUsedAt: link.lastUsedAt }
}

/** A new link for the profile; the one before it stops working. */
export async function createAccountantLink(userId: string, profileId: string): Promise<AccountantLinkView> {
  await getPackageProfile(userId, profileId)
  const { token, tokenHash, tokenEncrypted } = newShareToken()
  const created = await db.transaction(async (tx) => {
    await tx
      .update(accountantLinks)
      .set({ revokedAt: new Date() })
      .where(and(eq(accountantLinks.userId, userId), eq(accountantLinks.issuingProfileId, profileId), isNull(accountantLinks.revokedAt)))
    const [link] = await tx
      .insert(accountantLinks)
      .values({ userId, issuingProfileId: profileId, tokenHash, tokenEncrypted })
      .returning()
    return link
  })
  return { url: linkUrl(token), createdAt: created.createdAt, lastUsedAt: null }
}

/** "Cancelar link": it stops working right away. */
export async function revokeAccountantLink(userId: string, profileId: string) {
  await db
    .update(accountantLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(accountantLinks.userId, userId), eq(accountantLinks.issuingProfileId, profileId), isNull(accountantLinks.revokedAt)))
}

/**
 * Who a token from the URL belongs to: the user and profile whose package it opens, and the
 * business name to show. A cancelled link and one that never existed look the same: null.
 */
export async function resolveAccountantToken(token: string) {
  if (!isShareToken(token)) return null
  const [row] = await db
    .select({ link: accountantLinks, businessName: issuingProfiles.businessName, rfc: issuingProfiles.rfc })
    .from(accountantLinks)
    .innerJoin(issuingProfiles, eq(issuingProfiles.id, accountantLinks.issuingProfileId))
    .where(and(eq(accountantLinks.tokenHash, hashShareToken(token)), isNull(accountantLinks.revokedAt)))
    .limit(1)
  if (!row) return null

  const { link } = row
  if (!link.lastUsedAt || Date.now() - link.lastUsedAt.getTime() > USE_NOTE_MINUTES * 60_000) {
    await db.update(accountantLinks).set({ lastUsedAt: new Date() }).where(eq(accountantLinks.id, link.id))
  }
  return { userId: link.userId, profileId: link.issuingProfileId, businessName: row.businessName, rfc: row.rfc }
}
