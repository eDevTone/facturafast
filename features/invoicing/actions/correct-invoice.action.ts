'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createCorrectionDraft } from '../services/invoice.service'

/**
 * "Corregir factura": opens (or reuses) the draft that will replace a stamped invoice. `toPpd`
 * makes it a PPD invoice: a PUE one not paid within its month is replaced that way.
 */
export async function correctInvoiceAction(invoiceId: string, options: { toPpd?: boolean } = {}) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    const draft = await createCorrectionDraft(invoiceId, userId, { toPpd: options.toPpd === true })
    revalidatePath('/invoices')
    return { success: true as const, invoiceId: draft.id }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'No se pudo crear la corrección',
    }
  }
}
