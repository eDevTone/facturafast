'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createInvoiceFormSchema } from '../schemas/invoice-form.schema'
import { createInvoice } from '../services/invoice.service'

export async function createInvoiceAction(data: unknown) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  const parsed = createInvoiceFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    const invoice = await createInvoice(userId, parsed.data)

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
