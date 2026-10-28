'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { deleteCatalogItem } from '../services/catalog.service'

export async function deleteCatalogItemAction(id: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    await deleteCatalogItem(id, userId)
    revalidatePath('/catalog')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No se pudo eliminar el servicio' }
  }
}
