import type { STAMP_PACKAGES, StampPackageId } from '../constants/plans'

export type { StampPackageId }

export type StampPackage = (typeof STAMP_PACKAGES)[number]

export interface AccountData {
  stampsBalance: number
  totalStampsPurchased: number
  totalStampsUsed: number
  conektaCustomerId: string | null
}

export interface PurchaseRecord {
  id: string
  packageId: string
  stampsAdded: number
  amountMxn: number
  conektaOrderId: string | null
  createdAt: Date
}
