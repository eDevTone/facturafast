import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { db } from '@database/client'
import { accounts } from '@database/schemas/subscriptions.schema'
import { stampPurchases } from '@database/schemas/stamp-purchases.schema'
import { STAMP_PACKAGES } from '../constants/plans'
import type { StampPackageId } from '../constants/plans'
import type { PaymentProviderId } from '../payment-providers/types'
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
      stripeCustomerId: existing.stripeCustomerId,
    }
  }

  const [created] = await db
    .insert(accounts)
    .values({ userId })
    .returning()

  return {
    stampsBalance: created.stampsBalance,
    totalStampsPurchased: created.totalStampsPurchased,
    totalStampsUsed: created.totalStampsUsed,
    conektaCustomerId: created.conektaCustomerId,
    stripeCustomerId: created.stripeCustomerId,
  }
}

/**
 * Persist the provider-specific customer id right after creation
 * (before the checkout redirect) so it survives drop-offs.
 */
export async function savePaymentCustomerId(
  userId: string,
  provider: PaymentProviderId,
  customerId: string,
): Promise<void> {
  const update = provider === 'stripe'
    ? { stripeCustomerId: customerId, updatedAt: new Date() }
    : { conektaCustomerId: customerId, updatedAt: new Date() }

  await db
    .update(accounts)
    .set(update)
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

type Executor = Pick<typeof db, 'update'>

/**
 * Take one stamp from the balance. Atomic: the guard keeps the balance from going negative.
 * Pass a transaction to reserve the stamp together with other writes.
 * @returns false when the user has no stamps left.
 */
export async function consumeStamp(userId: string, executor: Executor = db): Promise<boolean> {
  const result = await executor
    .update(accounts)
    .set({
      stampsBalance: sql`stamps_balance - 1`,
      totalStampsUsed: sql`total_stamps_used + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.userId, userId), gt(accounts.stampsBalance, 0)))
    .returning({ id: accounts.id })

  return result.length > 0
}

/** Give back a stamp reserved for a stamping attempt that the PAC rejected. */
export async function refundStamp(userId: string, executor: Executor = db): Promise<void> {
  await executor
    .update(accounts)
    .set({
      stampsBalance: sql`stamps_balance + 1`,
      totalStampsUsed: sql`greatest(total_stamps_used - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(accounts.userId, userId))
}

/**
 * Add stamps to user's balance after a successful purchase.
 * Idempotent: the purchase row is inserted first against a unique order id, and the
 * balance only moves when that insert happened, all in one transaction.
 * @returns true when stamps were added, false when the order was already credited.
 */
export async function addStamps(
  userId: string,
  packageId: StampPackageId,
  provider: PaymentProviderId,
  externalOrderId: string,
): Promise<boolean> {
  const pkg = STAMP_PACKAGES.find(p => p.id === packageId)
  if (!pkg) throw new Error(`Package not found: ${packageId}`)

  // Make sure the account row exists before crediting it.
  await getOrCreateAccount(userId)

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(stampPurchases)
      .values({
        userId,
        packageId,
        stampsAdded: pkg.stamps,
        amountMxn: pkg.price * 100,
        paymentProvider: provider,
        conektaOrderId: provider === 'conekta' ? externalOrderId : null,
        stripeSessionId: provider === 'stripe' ? externalOrderId : null,
      })
      .onConflictDoNothing()
      .returning({ id: stampPurchases.id })

    if (inserted.length === 0) {
      console.log(`[billing] Skipping duplicate ${provider} order: ${externalOrderId}`)
      return false
    }

    await tx
      .update(accounts)
      .set({
        stampsBalance: sql`stamps_balance + ${pkg.stamps}`,
        totalStampsPurchased: sql`total_stamps_purchased + ${pkg.stamps}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.userId, userId))

    return true
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
    paymentProvider: row.paymentProvider as PaymentProviderId,
    conektaOrderId: row.conektaOrderId,
    stripeSessionId: row.stripeSessionId,
    createdAt: row.createdAt,
  }))
}
