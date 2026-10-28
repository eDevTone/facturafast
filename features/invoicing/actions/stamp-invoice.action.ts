'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { stampInvoice } from '../services/invoice.service'

export async function stampInvoiceAction(invoiceId: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const result = await stampInvoice(invoiceId, userId)

    if (!result.success) {
      return { success: false as const, error: result.error, code: result.code, fix: result.fix }
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)

    return {
      success: true as const,
      uuid: result.uuid,
      replacement: result.replacement,
    }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al timbrar la factura',
      code: undefined,
      fix: undefined,
    }
  }
}
