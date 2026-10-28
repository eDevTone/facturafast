'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import type { CancellationReason } from '../constants/cancellation-reasons'
import { cancelInvoice } from '../services/cancellation.service'

export async function cancelInvoiceAction(
  invoiceId: string,
  reason: CancellationReason,
  replacementUuid?: string,
) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const result = await cancelInvoice(invoiceId, userId, reason, replacementUuid)

    if (!result.success) {
      return { success: false as const, error: result.error }
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)

    return { success: true as const, outcome: result.outcome, cancellable: result.cancellable }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al cancelar la factura',
    }
  }
}
