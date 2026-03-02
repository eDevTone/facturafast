import { z } from 'zod'

// Invoice item schema
export const invoiceItemSchema = z.object({
  claveProdServ: z.string().optional(),
  descripcion: z.string().min(1, 'Descripción requerida'),
  cantidad: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  unidad: z.string().optional(),
  valorUnitario: z.number().min(0.01, 'Valor unitario debe ser mayor a 0')
})

// Create invoice form schema
export const createInvoiceFormSchema = z.object({
  clientId: z.string().uuid('Cliente requerido'),
  serie: z.string().optional(),
  formaPago: z.string().min(1, 'Forma de pago requerida'),
  metodoPago: z.string().min(1, 'Método de pago requerido'),
  usoCfdi: z.string().min(1, 'Uso CFDI requerido'),
  moneda: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Debe agregar al menos un concepto')
})

export type InvoiceFormData = z.infer<typeof createInvoiceFormSchema>
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>
