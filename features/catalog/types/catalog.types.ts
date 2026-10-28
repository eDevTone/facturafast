import type { CatalogItemRow } from '@database/schemas/catalog.schema'

/** A saved service: a concept ready to fill an invoice line. */
export type CatalogItem = CatalogItemRow

export interface CatalogItemInput {
  description: string
  /** ClaveProdServ (8 digits). */
  productServiceCode: string
  /** ClaveUnidad. */
  unit: string
  /** Before IVA; null when it changes from invoice to invoice. */
  unitPrice: number | null
}
