'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createInvoice } from '../services/invoice.service'
import type { CreateInvoiceInput } from '../types/invoice.types'

export async function createInvoiceAction(data: CreateInvoiceInput) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const invoice = await createInvoice(userId, data)

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoice.id}`)

    return {
      success: true as const,
      invoiceId: invoice.id,
    }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al crear la factura',
    }
  }
}
