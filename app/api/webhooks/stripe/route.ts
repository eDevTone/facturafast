import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { addStamps } from '@features/billing/services/account.service'
import { STAMP_PACKAGES } from '@features/billing/constants/plans'

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured')
  return new Stripe(secretKey)
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  return secret
}

export async function POST(request: Request) {
  // Raw body is required for signature verification — `.json()` would re-serialize and break it.
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret())
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Stripe Webhook]', event.type)

  try {
    // checkout.session.completed → card payments (immediate) or async session creation.
    // checkout.session.async_payment_succeeded → OXXO / SPEI confirmed by the bank or store.
    // Both deliver a Checkout Session object; we credit stamps only when payment_status === 'paid'.
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status !== 'paid') {
        console.log(`[Stripe Webhook] Session ${session.id} not paid yet (status: ${session.payment_status})`)
        return NextResponse.json({ received: true })
      }

      const userId = session.metadata?.user_id ?? session.client_reference_id
      const pkg = STAMP_PACKAGES.find((p) => p.id === session.metadata?.package_id)

      if (!userId || !pkg) {
        console.error(`[Stripe Webhook] Session ${session.id} has no valid user_id/package_id`)
        return NextResponse.json({ received: true })
      }

      if (session.currency?.toLowerCase() !== 'mxn' || session.amount_total !== pkg.price * 100) {
        console.error(`[Stripe Webhook] Session ${session.id} amount ${session.amount_total} does not match package ${pkg.id}`)
        return NextResponse.json({ received: true })
      }

      const credited = await addStamps(userId, pkg.id, 'stripe', session.id)
      console.log(`[Stripe Webhook] Session ${session.id}: ${credited ? `added ${pkg.stamps} stamps` : 'already credited'}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
