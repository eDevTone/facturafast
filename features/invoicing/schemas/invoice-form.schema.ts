import { z } from 'zod'
import { MAX_PAYMENT_TERMS_DAYS } from '@features/collections/utils/due-date'

// Invoice item schema
export const invoiceItemSchema = z.object({
  productServiceCode: z.string().regex(/^\d{8}$/, 'Elige la clave SAT del concepto'),
  description: z.string().trim().min(1, 'Describe el concepto'),
  quantity: z.number().min(0.000001, 'La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'Elige la unidad'),
  unitPrice: z.number().min(0.01, 'El precio debe ser mayor a 0')
})

// Create invoice form schema
export const createInvoiceFormSchema = z.object({
  clientId: z.string().uuid('Elige un cliente'),
  issuingProfileId: z.string().uuid('Elige un perfil fiscal'),
  serie: z.string().max(25).optional(),
  paymentForm: z.string().min(1, 'Elige la forma de pago'),
  paymentMethod: z.enum(['PUE', 'PPD'], { message: 'Elige el método de pago' }),
  cfdiUsage: z.string().min(1, 'Elige el uso del CFDI'),
  /** MXN, or USD for clients that pay in dollars (the only currency with a daily DOF rate). */
  currency: z.enum(['MXN', 'USD']),
  /** TipoCambio, pesos per dollar; null in pesos. */
  exchangeRate: z.number().positive('Escribe el tipo de cambio').max(1_000_000, 'Revisa el tipo de cambio').nullable(),
  /** 'dof': Banxico's rate, refreshed for the stamping day; 'manual': typed, kept as is. */
  exchangeRateSource: z.enum(['dof', 'manual']).nullable(),
  /** 0.16, or 0 for exported services (LIVA art. 29). */
  ivaRate: z.number().refine((rate) => [0, 0.16].includes(rate), 'El IVA es 16 % o 0 %'),
  pricesIncludeIva: z.boolean(),
  isrWithholdingRate: z.number().min(0).max(0.35).nullable(),
  ivaWithholdingRate: z.number().min(0).max(0.16).nullable(),
  /** "Días de crédito": the due date is the stamping day plus these days; null: no due date. */
  paymentTermsDays: z
    .number({ invalid_type_error: 'Escribe los días con número' })
    .int('Usa días completos')
    .min(0, 'Los días no pueden ser negativos')
    .max(MAX_PAYMENT_TERMS_DAYS, `Máximo ${MAX_PAYMENT_TERMS_DAYS} días`)
    .nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Agrega al menos un concepto')
}).refine(
  // SAT rule: a PPD invoice (paid later or in parts) carries FormaPago 99 "Por definir".
  (data) => data.paymentMethod !== 'PPD' || data.paymentForm === '99',
  { message: 'Si se paga después (PPD), la forma de pago es "99 - Por definir"', path: ['paymentForm'] },
).refine(
  // TipoCambio is required when the currency is not MXN (CFDI40115).
  (data) => data.currency === 'MXN' || (data.exchangeRate ?? 0) > 0,
  { message: 'Escribe el tipo de cambio del dólar', path: ['exchangeRate'] },
)

export type InvoiceFormData = z.infer<typeof createInvoiceFormSchema>
export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>
