'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { refreshCancellationStatus } from '../services/cancellation.service'

/** "Actualizar estatus": asks the SAT where the cancellation of an invoice stands. */
export async function refreshCancellationStatusAction(invoiceId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    const { decision } = await refreshCancellationStatus(invoiceId, userId)
    if (decision !== 'unchanged') {
      revalidatePath('/invoices')
      revalidatePath(`/invoices/${invoiceId}`)
    }
    return { success: true as const, decision }
  } catch (error) {
    console.error('[cancel] Refresh failed:', error instanceof Error ? error.message : error)
    return { success: false as const, error: 'No pudimos consultar al SAT; intenta en unos minutos.' }
  }
}
