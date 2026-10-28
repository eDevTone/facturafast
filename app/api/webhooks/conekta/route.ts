import { NextResponse } from 'next/server'
import { addStamps } from '@features/billing/services/account.service'
import { STAMP_PACKAGES } from '@features/billing/constants/plans'
import { fetchConektaOrder } from '@features/billing/payment-providers/conekta.provider'

interface ConektaWebhookEvent {
  type?: string
  data?: { object?: { id?: string } }
}

/**
 * Conekta order webhook.
 * The request body is untrusted: we only take the order id from it, then read the order
 * from Conekta's API and credit stamps when that order is paid for the exact package price.
 */
export async function POST(request: Request) {
  let event: ConektaWebhookEvent
  try {
    event = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.type !== 'order.paid') {
    return NextResponse.json({ received: true })
  }

  const orderId = event.data?.object?.id
  if (!orderId || !/^ord_[A-Za-z0-9]+$/.test(orderId)) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  try {
    const order = await fetchConektaOrder(orderId)

    if (order.paymentStatus !== 'paid') {
      console.warn(`[Conekta Webhook] Order ${order.id} is not paid (${order.paymentStatus})`)
      return NextResponse.json({ received: true })
    }

    const userId = order.metadata.user_id
    const pkg = STAMP_PACKAGES.find((p) => p.id === order.metadata.package_id)
    if (!userId || !pkg) {
      console.error(`[Conekta Webhook] Order ${order.id} has no valid user_id/package_id`)
      return NextResponse.json({ received: true })
    }

    if (order.currency !== 'MXN' || order.amount !== pkg.price * 100) {
      console.error(`[Conekta Webhook] Order ${order.id} amount ${order.amount} ${order.currency} does not match package ${pkg.id}`)
      return NextResponse.json({ received: true })
    }

    const credited = await addStamps(userId, pkg.id, 'conekta', order.id)
    console.log(`[Conekta Webhook] Order ${order.id}: ${credited ? `added ${pkg.stamps} stamps` : 'already credited'}`)

    return NextResponse.json({ received: true })
  } catch (error) {
    // 500 makes Conekta retry; addStamps is idempotent per order id.
    console.error('[Conekta Webhook] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
