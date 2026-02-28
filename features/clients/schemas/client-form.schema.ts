import { z } from 'zod'

// RFC validation (basic)
const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

export const createClientFormSchema = z.object({
  rfc: z
    .string()
    .min(12, 'RFC debe tener al menos 12 caracteres')
    .max(13, 'RFC debe tener máximo 13 caracteres')
    .regex(rfcRegex, 'RFC inválido')
    .transform(val => val.toUpperCase()),
  razonSocial: z.string().min(1, 'Razón social requerida'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  codigoPostal: z
    .string()
    .min(5, 'Código postal debe tener 5 dígitos')
    .max(5, 'Código postal debe tener 5 dígitos')
    .regex(/^\d{5}$/, 'Código postal debe ser numérico'),
  regimenFiscal: z.string().optional(),
  usoCfdi: z.string().optional().default('P01')
})

export type ClientFormData = z.infer<typeof createClientFormSchema>
