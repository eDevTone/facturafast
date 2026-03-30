import { NextResponse } from 'next/server'
import {
  activateSubscription,
  renewSubscription,
  markPastDue,
  cancelSubscription,
} from '@features/billing/services/subscription.service'
import type { PlanId } from '@features/billing/types/billing.types'

interface ConektaWebhookEvent {
  type: string
  data: {
    object: {
      id: string
      customer_id?: string
      metadata?: {
        plan_id?: string
        user_id?: string
      }
      subscription_id?: string
    }
  }
}

export async function POST(request: Request) {
  try {
    const event: ConektaWebhookEvent = await request.json()

    console.log('[Conekta Webhook]', event.type, JSON.stringify(event.data, null, 2))

    const userId = event.data.object.metadata?.user_id
    if (!userId) {
      console.error('[Conekta Webhook] No user_id in metadata')
      return NextResponse.json({ received: true })
    }

    switch (event.type) {
      case 'order.paid': {
        const planId = (event.data.object.metadata?.plan_id || 'starter') as PlanId
        const customerId = event.data.object.customer_id || ''
        const subscriptionId = event.data.object.subscription_id || ''

        await activateSubscription(userId, planId, customerId, subscriptionId)
        console.log(`[Conekta Webhook] Activated ${planId} for ${userId}`)
        break
      }

      case 'subscription.paid': {
        await renewSubscription(userId)
        console.log(`[Conekta Webhook] Renewed subscription for ${userId}`)
        break
      }

      case 'subscription.payment_failed': {
        await markPastDue(userId)
        console.log(`[Conekta Webhook] Marked past_due for ${userId}`)
        break
      }

      case 'subscription.canceled': {
        await cancelSubscription(userId)
        console.log(`[Conekta Webhook] Cancelled subscription for ${userId}`)
        break
      }

      default:
        console.log(`[Conekta Webhook] Unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Conekta Webhook] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
