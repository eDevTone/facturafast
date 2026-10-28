'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { cancelPayment, type PaymentCancellationReason } from '../services/payment-cancellation.service'

/** Asks the SAT to cancel a complemento de pago of an invoice. */
export async function cancelPaymentAction(
  paymentId: string,
  invoiceId: string,
  reason: PaymentCancellationReason,
  substituteUuid?: string,
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const result = await cancelPayment(paymentId, userId, reason, substituteUuid)
    if (!result.success) {
      return { success: false as const, error: result.error }
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true as const, outcome: result.outcome, cancellable: result.cancellable }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al cancelar el cobro',
    }
  }
}
