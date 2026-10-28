'use server'

import { auth } from '@clerk/nextjs/server'
import { getCancellationPreview } from '../services/cancellation.service'

/** For the cancel and correct dialogs: what the SAT says about cancelling this invoice. */
export async function getCancellationPreviewAction(invoiceId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    return { success: true as const, preview: await getCancellationPreview(invoiceId, userId) }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No pudimos consultar al SAT' }
  }
}
