'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { cancelClientRequest, createClientRequest } from '../services/client-request.service'

/** "Pedir datos a un cliente" (a new one, by `label`) or "Pedirle que actualice sus datos" (`clientId`). */
export async function createClientRequestAction(input: { label?: string; clientId?: string }) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    const request = await createClientRequest(userId, input)
    revalidatePath('/clients')
    return { success: true as const, request }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No pudimos crear el link' }
  }
}

/** "Cancelar": the link stops working. */
export async function cancelClientRequestAction(id: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    await cancelClientRequest(userId, id)
    revalidatePath('/clients')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No pudimos cancelar el link' }
  }
}
