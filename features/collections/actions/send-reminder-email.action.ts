'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendReminderEmail } from '../services/collection.service'

const messageSchema = z
  .string()
  .trim()
  .min(1, 'Escribe el mensaje del recordatorio')
  .max(2000, 'Usa un mensaje más corto (máximo 2000 caracteres)')

/** "Enviar por correo": the reminder with the invoice XML and PDF. */
export async function sendReminderEmailAction(invoiceId: string, message: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  const parsed = messageSchema.safeParse(message)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Revisa el mensaje' }

  try {
    const { to } = await sendReminderEmail(invoiceId, userId, parsed.data)
    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true as const, to }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No se envió el recordatorio' }
  }
}
