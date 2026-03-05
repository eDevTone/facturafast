'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { deleteInvoice } from '../services/invoice.service'

export async function deleteInvoiceAction(id: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    await deleteInvoice(id, userId)
    revalidatePath('/invoices')
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al eliminar la factura',
    }
  }
}
