'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOrCreateAccount, saveConektaCustomerId } from '../services/account.service'
import { createCustomer, createCheckoutOrder } from '../services/conekta.service'
import type { StampPackageId } from '../constants/plans'

export async function createCheckoutAction(packageId: StampPackageId) {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  const user = await currentUser()
  if (!user) return { error: 'No autorizado' }

  const account = await getOrCreateAccount(userId)

  // Get or create Conekta customer (save immediately to avoid losing it)
  let conektaCustomerId = account.conektaCustomerId
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
    packageId,
    `${baseUrl}/billing?success=true&package=${packageId}`,
    `${baseUrl}/billing?error=true`,
  )

  redirect(checkoutUrl)
}
