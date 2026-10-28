'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { catalogItemSchema, type CatalogItemFormData } from '../schemas/catalog-item.schema'
import { saveConceptToCatalog } from '../services/catalog.service'

/** "Guardar en mis servicios" from an invoice line; `created` is false when it updated a service with the same description. */
export async function saveConceptToCatalogAction(data: CatalogItemFormData) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  const parsed = catalogItemSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Completa el concepto antes de guardarlo' }
  }

  try {
    const { item, created } = await saveConceptToCatalog(userId, parsed.data)
    revalidatePath('/catalog')
    return { success: true as const, item, created }
  } catch (error) {
    console.error('Error saving concept to catalog:', error)
    return { success: false as const, error: 'No se pudo guardar el servicio' }
  }
}
