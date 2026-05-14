import type { STAMP_PACKAGES, StampPackageId } from '../constants/plans'
import type { PaymentProviderId } from '../payment-providers/types'

export type { StampPackageId, PaymentProviderId }

export type StampPackage = (typeof STAMP_PACKAGES)[number]

export interface AccountData {
  stampsBalance: number
  totalStampsPurchased: number
  totalStampsUsed: number
  conektaCustomerId: string | null
  stripeCustomerId: string | null
}

export interface PurchaseRecord {
  id: string
  packageId: string
  stampsAdded: number
  amountMxn: number
  paymentProvider: PaymentProviderId
  conektaOrderId: string | null
  stripeSessionId: string | null
  createdAt: Date
}
