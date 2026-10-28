'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { refreshPaymentCancellations } from '../services/payment-cancellation.service'

/**
 * Asks the SAT about the complementos of an invoice whose cancellation is pending. `force` skips
 * the one-minute wait between queries (the "Actualizar" button).
 */
export async function refreshPaymentCancellationsAction(invoiceId: string, force = false) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, changed: 0 }

  try {
    const changed = await refreshPaymentCancellations(invoiceId, userId, force ? 0 : undefined)
    if (changed > 0) {
      revalidatePath('/invoices')
      revalidatePath(`/invoices/${invoiceId}`)
    }
    return { success: true as const, changed }
  } catch (error) {
    console.error('[payments] Refresh failed:', error instanceof Error ? error.message : error)
    return { success: false as const, changed: 0 }
  }
}
