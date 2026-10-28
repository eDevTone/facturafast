import { z } from 'zod'

export const catalogItemSchema = z.object({
  description: z.string().trim().min(1, 'Describe el servicio').max(1000, 'Usa una descripción más corta'),
  productServiceCode: z.string().regex(/^\d{8}$/, 'Elige la clave SAT del servicio'),
  unit: z.string().trim().min(1, 'Elige la unidad').max(10),
  unitPrice: z.number().min(0.01, 'El precio debe ser mayor a 0').max(999_999_999_999, 'Revisa el precio').nullable(),
})

export type CatalogItemFormData = z.infer<typeof catalogItemSchema>
