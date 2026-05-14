import { conektaProvider } from './conekta.provider'
import { stripeProvider } from './stripe.provider'
import type { PaymentProvider, PaymentProviderId } from './types'

const PROVIDERS: Record<PaymentProviderId, PaymentProvider> = {
  conekta: conektaProvider,
  stripe: stripeProvider,
}

export function getActiveProvider(): PaymentProvider {
  const id = (process.env.PAYMENT_PROVIDER ?? 'conekta') as PaymentProviderId
  const provider = PROVIDERS[id]
  if (!provider) {
    throw new Error(`Unknown PAYMENT_PROVIDER: ${id}. Expected 'conekta' or 'stripe'.`)
  }
  return provider
}

export type { PaymentProvider, PaymentProviderId } from './types'
