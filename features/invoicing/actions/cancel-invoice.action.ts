'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { cancelInvoice } from '../services/invoice.service'

export async function cancelInvoiceAction(
  invoiceId: string,
  reason: '01' | '02' | '03' | '04',
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

    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al cancelar la factura',
    }
  }
}
