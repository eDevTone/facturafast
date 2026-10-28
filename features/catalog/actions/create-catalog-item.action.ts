'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { catalogItemSchema, type CatalogItemFormData } from '../schemas/catalog-item.schema'
import { createCatalogItem } from '../services/catalog.service'

export async function createCatalogItemAction(data: CatalogItemFormData) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  const parsed = catalogItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Revisa los datos del servicio' }
  }

  try {
    const item = await createCatalogItem(userId, parsed.data)
    revalidatePath('/catalog')
    return { success: true as const, item }
  } catch (error) {
    console.error('Error creating catalog item:', error)
    return { success: false as const, error: 'No se pudo guardar el servicio' }
  }
}
