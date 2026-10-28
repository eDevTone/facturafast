import { z } from 'zod'
import { MAX_PAYMENT_TERMS_DAYS } from '@features/collections/utils/due-date'
import { FOREIGN_RFC, IVA_RATE_CHOICES } from '../utils/foreign-client'

// RFC validation (basic)
const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

/**
 * A client in México (RFC, CP, régimen) or abroad (country, tax id and the IVA it is charged).
 * The fields of the other kind are ignored.
 */
export const createClientFormSchema = z.object({
  isForeign: z.boolean(),
  rfc: z.string().trim().transform(val => val.toUpperCase()),
  businessName: z
    .string()
    .trim()
    .min(1, 'Escribe el nombre o la razón social')
    .max(300, 'Usa un nombre más corto')
    .refine(val => !val.includes('|'), 'El nombre no puede llevar el carácter |'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  postalCode: z.string().optional(),
  taxRegime: z.string().optional(),
  cfdiUsage: z.string().optional(), // Optional, Select has defaultValue
  country: z.string().optional(),
  foreignTaxId: z.string().max(40, 'Máximo 40 caracteres').optional(),
  ivaRate: z.enum(IVA_RATE_CHOICES).optional(),
  /** "Días de crédito"; null: no term. */
  paymentTermsDays: z
    .number({ invalid_type_error: 'Escribe los días con número' })
    .int('Usa días completos')
    .min(0, 'Los días no pueden ser negativos')
    .max(MAX_PAYMENT_TERMS_DAYS, `Máximo ${MAX_PAYMENT_TERMS_DAYS} días`)
    .nullable()
    .optional(),
}).superRefine((data, ctx) => {
  if (data.isForeign) {
    if (!data.country || data.country === 'MEX') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['country'], message: 'Elige el país de tu cliente' })
    }
    if (!data.ivaRate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ivaRate'], message: 'Elige el IVA que le cobras' })
    }
    return
  }

  if (data.rfc === FOREIGN_RFC) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rfc'], message: 'Para un cliente del extranjero, elige «En el extranjero»' })
  } else if (data.rfc.length < 12 || data.rfc.length > 13 || !rfcRegex.test(data.rfc)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rfc'], message: 'RFC inválido' })
  }
  if (!/^\d{5}$/.test(data.postalCode ?? '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'El código postal tiene 5 dígitos' })
  }
  if (!data.taxRegime) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['taxRegime'], message: 'Régimen fiscal requerido' })
  }
})

export type ClientFormData = z.infer<typeof createClientFormSchema>
