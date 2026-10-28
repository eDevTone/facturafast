import { db } from '@database/client'
import { catalogItems } from '@database/schemas/catalog.schema'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import type { CatalogItem, CatalogItemInput } from '../types/catalog.types'

function values(data: CatalogItemInput) {
  return {
    description: data.description.trim(),
    productServiceCode: data.productServiceCode,
    unit: data.unit.trim(),
    unitPrice: data.unitPrice === null ? null : data.unitPrice.toFixed(2),
  }
}

/** The user's saved services (not deleted), in alphabetical order for the picker. */
export async function getCatalogItems(userId: string): Promise<CatalogItem[]> {
  return db.query.catalogItems.findMany({
    where: and(eq(catalogItems.userId, userId), isNull(catalogItems.deletedAt)),
    orderBy: asc(catalogItems.description),
  })
}

export async function getCatalogItemById(id: string, userId: string): Promise<CatalogItem | undefined> {
  return db.query.catalogItems.findFirst({
    where: and(eq(catalogItems.id, id), eq(catalogItems.userId, userId), isNull(catalogItems.deletedAt)),
  })
}

export async function createCatalogItem(userId: string, data: CatalogItemInput): Promise<CatalogItem> {
  const [item] = await db.insert(catalogItems).values({ userId, ...values(data) }).returning()
  return item
}

export async function updateCatalogItem(id: string, userId: string, data: CatalogItemInput): Promise<CatalogItem> {
  const [item] = await db
    .update(catalogItems)
    .set({ ...values(data), updatedAt: new Date() })
    .where(and(eq(catalogItems.id, id), eq(catalogItems.userId, userId), isNull(catalogItems.deletedAt)))
    .returning()
  if (!item) throw new Error('Servicio no encontrado')
  return item
}

/** Soft delete: the service leaves the list; invoices that used it keep their own copy of the concept. */
export async function deleteCatalogItem(id: string, userId: string) {
  const [item] = await db
    .update(catalogItems)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(catalogItems.id, id), eq(catalogItems.userId, userId), isNull(catalogItems.deletedAt)))
    .returning({ id: catalogItems.id })
  if (!item) throw new Error('Servicio no encontrado')
}

/**
 * "Guardar en mis servicios" from an invoice line: updates the service with the same description
 * (ignoring case), or creates it.
 */
export async function saveConceptToCatalog(
  userId: string,
  data: CatalogItemInput,
): Promise<{ item: CatalogItem; created: boolean }> {
  const existing = await db.query.catalogItems.findFirst({
    where: and(
      eq(catalogItems.userId, userId),
      isNull(catalogItems.deletedAt),
      sql`lower(${catalogItems.description}) = lower(${data.description.trim()})`,
    ),
  })
  if (existing) return { item: await updateCatalogItem(existing.id, userId, data), created: false }
  return { item: await createCatalogItem(userId, data), created: true }
}
