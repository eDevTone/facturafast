import Stripe from 'stripe'
import { STAMP_PACKAGES } from '../constants/plans'
import type { PaymentProvider, CreateCheckoutInput, CreateCheckoutResult } from './types'

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(secretKey)
}

async function ensureCustomer(input: CreateCheckoutInput): Promise<string> {
  if (input.existingCustomerId) return input.existingCustomerId
  const stripe = getStripe()
  const customer = await stripe.customers.create({
    name: input.customerName,
    email: input.customerEmail,
    metadata: { user_id: input.userId },
  })
  return customer.id
}

export const stripeProvider: PaymentProvider = {
  id: 'stripe',
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const pkg = STAMP_PACKAGES.find(p => p.id === input.packageId)
    if (!pkg) throw new Error(`Package ${input.packageId} not found`)

    const stripe = getStripe()
    const customerId = await ensureCustomer(input)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      payment_method_types: ['card', 'oxxo', 'customer_balance'],
      payment_method_options: {
        customer_balance: {
          funding_type: 'bank_transfer',
          bank_transfer: { type: 'mx_bank_transfer' },
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `FacturaFast ${pkg.name} — ${pkg.stamps} timbres`,
            },
            unit_amount: pkg.price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.failureUrl,
      client_reference_id: input.userId,
      metadata: {
        package_id: input.packageId,
        user_id: input.userId,
      },
    })

    if (!session.url) throw new Error('Stripe did not return a checkout URL')

    return {
      customerId,
      checkoutUrl: session.url,
      externalOrderId: session.id,
    }
  },
}
