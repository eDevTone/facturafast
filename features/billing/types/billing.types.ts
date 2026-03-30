import type { PLAN_LIMITS } from '../constants/plans'

export type PlanId = keyof typeof PLAN_LIMITS

export interface PlanDefinition {
  id: PlanId
  name: string
  price: number
  regularPrice: number
  stamps: number | typeof Infinity
  features: string[]
  conektaPlanId?: string
  recommended?: boolean
}

export const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}
