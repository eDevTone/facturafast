import { eq } from 'drizzle-orm'
import { db } from '@database/client'
import { subscriptions } from '@database/schemas/subscriptions.schema'
import { PLAN_LIMITS } from '../constants/plans'
import type { PlanId } from '../types/billing.types'

export interface SubscriptionData {
  plan: PlanId
  status: 'active' | 'past_due' | 'cancelled'
  stampsUsed: number
  stampsLimit: number
  currentPeriodEnd: Date | null
  conektaCustomerId: string | null
  conektaSubscriptionId: string | null
}

/**
 * Get or create a subscription for a user.
 * New users automatically get the free plan.
 */
export async function getOrCreateSubscription(userId: string): Promise<SubscriptionData> {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  if (existing) {
    const plan = existing.plan as PlanId
    return {
      plan,
      status: existing.status as SubscriptionData['status'],
      stampsUsed: existing.stampsUsed,
      stampsLimit: PLAN_LIMITS[plan].stamps,
      currentPeriodEnd: existing.currentPeriodEnd,
      conektaCustomerId: existing.conektaCustomerId,
      conektaSubscriptionId: existing.conektaSubscriptionId,
    }
  }

  // Create free subscription for new user
  const [created] = await db
    .insert(subscriptions)
    .values({
      userId,
      plan: 'free',
      status: 'active',
      stampsUsed: 0,
      currentPeriodStart: new Date(),
    })
    .returning()

  return {
    plan: 'free',
    status: 'active',
    stampsUsed: 0,
    stampsLimit: PLAN_LIMITS.free.stamps,
    currentPeriodEnd: created.currentPeriodEnd,
    conektaCustomerId: null,
    conektaSubscriptionId: null,
  }
}

/**
 * Save Conekta customer ID immediately after creation (before checkout redirect).
 */
export async function saveConektaCustomerId(userId: string, conektaCustomerId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ conektaCustomerId, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId))
}

/**
 * Check if the user can stamp (hasn't exceeded their plan limit).
 */
export async function checkUsageLimit(userId: string): Promise<{
  canStamp: boolean
  used: number
  limit: number
  plan: PlanId
}> {
  const sub = await getOrCreateSubscription(userId)

  if (sub.plan === 'business') {
    return { canStamp: true, used: sub.stampsUsed, limit: Infinity, plan: sub.plan }
  }

  return {
    canStamp: sub.stampsUsed < sub.stampsLimit,
    used: sub.stampsUsed,
    limit: sub.stampsLimit,
    plan: sub.plan,
  }
}

/**
 * Increment stamps used after a successful stamping.
 */
export async function incrementStampsUsed(userId: string): Promise<void> {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  if (!existing) return

  await db
    .update(subscriptions)
    .set({
      stampsUsed: existing.stampsUsed + 1,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
}

/**
 * Update subscription after a successful payment (webhook).
 */
export async function activateSubscription(
  userId: string,
  plan: PlanId,
  conektaCustomerId: string,
  conektaSubscriptionId: string,
): Promise<void> {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await db
    .update(subscriptions)
    .set({
      plan,
      status: 'active',
      conektaCustomerId,
      conektaSubscriptionId,
      stampsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId))
}

/**
 * Renew subscription period (webhook: subscription.paid).
 */
export async function renewSubscription(userId: string): Promise<void> {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  await db
    .update(subscriptions)
    .set({
      status: 'active',
      stampsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId))
}

/**
 * Mark subscription as past_due (webhook: subscription.payment_failed).
 */
export async function markPastDue(userId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({ status: 'past_due', updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId))
}

/**
 * Cancel subscription (webhook or user action).
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      plan: 'free',
      status: 'cancelled',
      conektaSubscriptionId: null,
      stampsUsed: 0,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId))
}
