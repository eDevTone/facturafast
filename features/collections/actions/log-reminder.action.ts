'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { logReminder } from '../services/collection.service'

/** Notes that the user opened WhatsApp to remind the client (the app cannot see the chat). */
export async function logWhatsappReminderAction(invoiceId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    await logReminder(invoiceId, userId, 'whatsapp')
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No se registró el recordatorio' }
  }
}
