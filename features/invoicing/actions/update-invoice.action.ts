'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { updateInvoice } from '../services/invoice.service'
import type { CreateInvoiceInput } from '../types/invoice.types'

export async function updateInvoiceAction(id: string, data: CreateInvoiceInput) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    await updateInvoice(id, userId, data)
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${id}`)
    return { success: true as const, invoiceId: id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al actualizar la factura',
    }
  }
}
