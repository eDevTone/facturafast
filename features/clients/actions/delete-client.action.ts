'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { deleteClient } from '../services/client.service'

export async function deleteClientAction(id: string) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  try {
    await deleteClient(id, userId)
    revalidatePath('/clients')
    return { success: true as const }
  } catch (error) {
    console.error('Error deleting client:', error)
    return {
      success: false as const,
      error: 'Error al eliminar el cliente',
    }
  }
}
