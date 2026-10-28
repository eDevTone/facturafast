'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClientFormSchema, type ClientFormData } from '../schemas/client-form.schema'
import { updateClient } from '../services/client.service'

export async function updateClientAction(id: string, data: ClientFormData) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  const validation = createClientFormSchema.safeParse(data)

  if (!validation.success) {
    return {
      success: false as const,
      error: validation.error.issues[0]?.message ?? 'Datos inválidos',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  try {
    await updateClient(id, userId, validation.data)
    revalidatePath('/clients')
    return { success: true as const }
  } catch (error) {
    console.error('Error updating client:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al actualizar el cliente',
    }
  }
}
