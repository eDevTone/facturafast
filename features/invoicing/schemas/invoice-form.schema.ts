import { z } from 'zod'

// Invoice item schema
export const invoiceItemSchema = z.object({
  productServiceCode: z.string().optional(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  unit: z.string().optional(),
  unitPrice: z.number().min(0.01, 'Valor unitario debe ser mayor a 0')
})

// Create invoice form schema
export const createInvoiceFormSchema = z.object({
  clientId: z.string().uuid('Cliente requerido'),
  issuingProfileId: z.string().uuid('Perfil fiscal requerido'),
  serie: z.string().optional(),
  paymentForm: z.string().min(1, 'Forma de pago requerida'),
  paymentMethod: z.string().min(1, 'Método de pago requerido'),
  cfdiUsage: z.string().min(1, 'Uso CFDI requerido'),
  currency: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Debe agregar al menos un concepto')
})

export type InvoiceFormData = z.infer<typeof createInvoiceFormSchema>
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>
