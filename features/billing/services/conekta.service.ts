import { PLANS } from '../constants/plans'
import type { PlanId } from '../types/billing.types'

function getConfig() {
  const apiKey = process.env.CONEKTA_API_KEY
  if (!apiKey) throw new Error('CONEKTA_API_KEY is not configured')
  return { apiKey }
}

const BASE_URL = 'https://api.conekta.io'
const API_VERSION = 'application/vnd.conekta-v2.2.0+json'

async function conektaFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { apiKey } = getConfig()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Accept': API_VERSION,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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

interface ConektaCustomer {
  id: string
  name: string
  email: string
}

/**
 * Create a customer in Conekta.
 */
export async function createCustomer(name: string, email: string): Promise<ConektaCustomer> {
  return conektaFetch<ConektaCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({ name, email }),
  })
}

interface ConektaCheckout {
  id: string
  url: string
}

interface ConektaOrder {
  id: string
  checkout: ConektaCheckout
}

/**
 * Create a Conekta order with hosted checkout for a subscription plan.
 * Returns the checkout URL to redirect the user.
 */
export async function createCheckoutOrder(
  customerId: string,
  userId: string,
  planId: PlanId,
  successUrl: string,
  failureUrl: string,
): Promise<{ orderId: string; checkoutUrl: string }> {
  const plan = PLANS.find(p => p.id === planId)
  if (!plan) throw new Error(`Plan ${planId} not found`)

  const order = await conektaFetch<ConektaOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      currency: 'MXN',
      customer_info: { customer_id: customerId },
      line_items: [
        {
          name: `FacturaFast ${plan.name}`,
          unit_price: plan.price * 100, // Conekta uses centavos
          quantity: 1,
        },
      ],
      checkout: {
        type: 'HostedPayment',
        allowed_payment_methods: ['card', 'cash', 'bank_transfer'],
        success_url: successUrl,
        failure_url: failureUrl,
      },
      plan_id: plan.conektaPlanId,
      metadata: {
        plan_id: planId,
        user_id: userId,
      },
    }),
  })

  return {
    orderId: order.id,
    checkoutUrl: order.checkout.url,
  }
}
