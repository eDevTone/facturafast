'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { setAwaitingPayment } from '../services/collection.service'

/** "Marcar por cobrar" (true) or "Ya me pagaron" (false) on a PUE invoice. */
export async function setAwaitingPaymentAction(invoiceId: string, awaiting: boolean) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    await setAwaitingPayment(invoiceId, userId, awaiting)
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No se pudo actualizar la factura' }
  }
}
