'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { StampPackageId } from '../constants/plans'
import { getActiveProvider } from '../payment-providers'
import { getOrCreateAccount, savePaymentCustomerId } from '../services/account.service'

export async function createCheckoutAction(packageId: StampPackageId) {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  const user = await currentUser()
  if (!user) return { error: 'No autorizado' }

  const account = await getOrCreateAccount(userId)
  const provider = getActiveProvider()

  const existingCustomerId = provider.id === 'stripe'
    ? account.stripeCustomerId
    : account.conektaCustomerId

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const result = await provider.createCheckout({
    userId,
    customerName: user.fullName || user.firstName || 'Usuario',
    customerEmail: user.emailAddresses[0]?.emailAddress || '',
    packageId,
    successUrl: `${baseUrl}/billing?success=true&package=${packageId}`,
    failureUrl: `${baseUrl}/billing?error=true`,
    existingCustomerId,
  })

  // Persist customer id immediately so we reuse it on subsequent purchases
  // even if the user drops off mid-flow.
  if (existingCustomerId !== result.customerId) {
    await savePaymentCustomerId(userId, provider.id, result.customerId)
  }

  redirect(result.checkoutUrl)
}
