'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateSubscription, saveConektaCustomerId } from '../services/subscription.service'
import { createCustomer, createCheckoutOrder } from '../services/conekta.service'
import type { PlanId } from '../types/billing.types'

export async function createCheckoutAction(planId: PlanId) {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  const user = await currentUser()
  if (!user) return { error: 'No autorizado' }

  const subscription = await getOrCreateSubscription(userId)

  // Get or create Conekta customer (save immediately to avoid losing it)
  let conektaCustomerId = subscription.conektaCustomerId
  if (!conektaCustomerId) {
    const customer = await createCustomer(
      user.fullName || user.firstName || 'Usuario',
      user.emailAddresses[0]?.emailAddress || '',
    )
    conektaCustomerId = customer.id
    await saveConektaCustomerId(userId, conektaCustomerId)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { checkoutUrl } = await createCheckoutOrder(
    conektaCustomerId,
    userId,
    planId,
    `${baseUrl}/billing?success=true&plan=${planId}`,
    `${baseUrl}/billing?error=true`,
  )

  redirect(checkoutUrl)
}
