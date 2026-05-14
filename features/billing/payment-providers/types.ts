import type { StampPackageId } from '../constants/plans'

export type PaymentProviderId = 'conekta' | 'stripe'

export interface CreateCheckoutInput {
  userId: string
  customerName: string
  customerEmail: string
  packageId: StampPackageId
  successUrl: string
  failureUrl: string
  existingCustomerId: string | null
}

export interface CreateCheckoutResult {
  customerId: string
  checkoutUrl: string
  externalOrderId: string
}

export interface PaymentProvider {
  readonly id: PaymentProviderId
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>
}
