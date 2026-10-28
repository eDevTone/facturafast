'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { retryPaymentStamp } from '../services/payment.service'

export async function retryPaymentStampAction(paymentId: string, invoiceId: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const result = await retryPaymentStamp(paymentId, userId)

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)

    if (!result.success) {
      return { success: false as const, error: result.error, code: result.code }
    }
    return { success: true as const, uuid: result.uuid }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al timbrar el cobro',
      code: undefined,
    }
  }
}
