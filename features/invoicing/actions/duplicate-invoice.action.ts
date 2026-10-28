'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { duplicateInvoice } from '../services/invoice.service'

export async function duplicateInvoiceAction(id: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const invoice = await duplicateInvoice(id, userId)
    revalidatePath('/invoices')
    return { success: true as const, invoiceId: invoice.id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo duplicar la factura',
    }
  }
}
