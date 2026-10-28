'use server'

import { auth } from '@clerk/nextjs/server'
import { getPaymentCancellationPreview } from '../services/payment-cancellation.service'

/** For the cancel dialog of a complemento: what the SAT says about cancelling it. */
export async function getPaymentCancellationPreviewAction(paymentId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    return { success: true as const, preview: await getPaymentCancellationPreview(paymentId, userId) }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No pudimos consultar al SAT' }
  }
}
