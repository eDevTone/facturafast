import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { db } from '@database/client'
import { accounts } from '@database/schemas/subscriptions.schema'
import { stampPurchases } from '@database/schemas/stamp-purchases.schema'
import { STAMP_PACKAGES } from '../constants/plans'
import type { StampPackageId } from '../constants/plans'
import type { AccountData, PurchaseRecord } from '../types/billing.types'

/**
 * Get or create an account for a user.
 * New users automatically get 3 welcome stamps.
 */
export async function getOrCreateAccount(userId: string): Promise<AccountData> {
  const existing = await db.query.accounts.findFirst({
    where: eq(accounts.userId, userId),
  })

  if (existing) {
    return {
      stampsBalance: existing.stampsBalance,
      totalStampsPurchased: existing.totalStampsPurchased,
      totalStampsUsed: existing.totalStampsUsed,
      conektaCustomerId: existing.conektaCustomerId,
    }
  }

  // Create account with 3 welcome stamps
  const [created] = await db
    .insert(accounts)
    .values({ userId })
    .returning()

  return {
    stampsBalance: created.stampsBalance,
    totalStampsPurchased: created.totalStampsPurchased,
    totalStampsUsed: created.totalStampsUsed,
    conektaCustomerId: created.conektaCustomerId,
  }
}

/**
 * Save Conekta customer ID immediately after creation (before checkout redirect).
 */
export async function saveConektaCustomerId(userId: string, conektaCustomerId: string): Promise<void> {
  await db
    .update(accounts)
    .set({ conektaCustomerId, updatedAt: new Date() })
    .where(eq(accounts.userId, userId))
}

/**
 * Check if the user has stamps available.
 */
export async function checkStampsBalance(userId: string): Promise<{
  canStamp: boolean
  balance: number
}> {
  const account = await getOrCreateAccount(userId)

  return {
    canStamp: account.stampsBalance > 0,
    balance: account.stampsBalance,
  }
}

/**
 * Consume one stamp after a successful CFDI stamping.
 * Uses atomic decrement with guard to prevent negative balance.
 */
export async function consumeStamp(userId: string): Promise<void> {
  const result = await db
    .update(accounts)
    .set({
      stampsBalance: sql`stamps_balance - 1`,
      totalStampsUsed: sql`total_stamps_used + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.userId, userId), gt(accounts.stampsBalance, 0)))
    .returning()

  if (result.length === 0) {
    throw new Error('No tienes timbres disponibles')
  }
}

/**
 * Add stamps to user's balance after a successful purchase.
 * Runs in a transaction: updates balance + inserts purchase record.
 */
export async function addStamps(
  userId: string,
  packageId: StampPackageId,
  conektaOrderId: string,
): Promise<void> {
  const pkg = STAMP_PACKAGES.find(p => p.id === packageId)
  if (!pkg) throw new Error(`Package not found: ${packageId}`)

  await db.transaction(async (tx) => {
    await tx
      .update(accounts)
      .set({
        stampsBalance: sql`stamps_balance + ${pkg.stamps}`,
        totalStampsPurchased: sql`total_stamps_purchased + ${pkg.stamps}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.userId, userId))

    await tx.insert(stampPurchases).values({
      userId,
      packageId,
      stampsAdded: pkg.stamps,
      amountMxn: pkg.price * 100,
      conektaOrderId,
    })
  })
}

/**
 * Get purchase history for a user, ordered by most recent first.
 */
export async function getPurchaseHistory(userId: string): Promise<PurchaseRecord[]> {
  const rows = await db.query.stampPurchases.findMany({
    where: eq(stampPurchases.userId, userId),
    orderBy: [desc(stampPurchases.createdAt)],
  })

  return rows.map(row => ({
    id: row.id,
    packageId: row.packageId,
    stampsAdded: row.stampsAdded,
    amountMxn: row.amountMxn,
    conektaOrderId: row.conektaOrderId,
    createdAt: row.createdAt,
  }))
}
