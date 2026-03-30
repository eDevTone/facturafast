'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { cancelSubscription } from '../services/subscription.service'

export async function cancelSubscriptionAction() {
  const { userId } = await auth()
  if (!userId) return { success: false, error: 'No autorizado' }

  try {
    await cancelSubscription(userId)
    revalidatePath('/billing')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cancelar la suscripción',
    }
  }
}
