import { NextResponse } from 'next/server'
import { addStamps } from '@features/billing/services/account.service'
import type { StampPackageId } from '@features/billing/constants/plans'

interface ConektaWebhookEvent {
  type: string
  data: {
    object: {
      id: string
      customer_id?: string
      metadata?: {
        package_id?: string
        user_id?: string
      }
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
        const packageId = (event.data.object.metadata?.package_id || 'starter') as StampPackageId
        const orderId = event.data.object.id

        await addStamps(userId, packageId, 'conekta', orderId)
        console.log(`[Conekta Webhook] Added stamps (${packageId}) for ${userId}`)
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
