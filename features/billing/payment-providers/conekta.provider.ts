import { STAMP_PACKAGES } from '../constants/plans'
import type { PaymentProvider, CreateCheckoutInput, CreateCheckoutResult } from './types'

const BASE_URL = 'https://api.conekta.io'
const API_VERSION = 'application/vnd.conekta-v2.2.0+json'

interface ConektaCustomer {
  id: string
  name: string
  email: string
}

interface ConektaCheckout {
  id: string
  url: string
}

interface ConektaOrder {
  id: string
  checkout: ConektaCheckout
}

function getApiKey(): string {
  const apiKey = process.env.CONEKTA_API_KEY
  if (!apiKey) throw new Error('CONEKTA_API_KEY is not configured')
  return apiKey
}

async function conektaFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Accept': API_VERSION,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[Conekta] API error:', data)
    throw new Error(data.details?.[0]?.message || data.message || 'Error de Conekta')
  }

  return data as T
}

async function ensureCustomer(input: CreateCheckoutInput): Promise<string> {
  if (input.existingCustomerId) return input.existingCustomerId
  const customer = await conektaFetch<ConektaCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({ name: input.customerName, email: input.customerEmail }),
  })
  return customer.id
}

export const conektaProvider: PaymentProvider = {
  id: 'conekta',
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const pkg = STAMP_PACKAGES.find(p => p.id === input.packageId)
    if (!pkg) throw new Error(`Package ${input.packageId} not found`)

    const customerId = await ensureCustomer(input)

    const order = await conektaFetch<ConektaOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        currency: 'MXN',
        customer_info: { customer_id: customerId },
        line_items: [
          {
            name: `FacturaFast ${pkg.name} — ${pkg.stamps} timbres`,
            unit_price: pkg.price * 100,
            quantity: 1,
          },
        ],
        checkout: {
          type: 'HostedPayment',
          allowed_payment_methods: ['card', 'cash', 'bank_transfer'],
          success_url: input.successUrl,
          failure_url: input.failureUrl,
        },
        metadata: {
          package_id: input.packageId,
          user_id: input.userId,
        },
      }),
    })

    return {
      customerId,
      checkoutUrl: order.checkout.url,
      externalOrderId: order.id,
    }
  },
}
