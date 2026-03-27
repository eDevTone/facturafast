import { z } from 'zod'

export const issuingProfileFormSchema = z.object({
  rfc: z
    .string()
    .min(12, 'Mínimo 12 caracteres')
    .max(13, 'Máximo 13 caracteres')
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, 'Formato RFC inválido'),
  businessName: z.string().min(3, 'Mínimo 3 caracteres'),
  taxRegime: z.string().min(1, 'Selecciona un régimen fiscal'),
  postalCode: z
    .string()
    .length(5, 'Debe tener 5 dígitos')
    .regex(/^[0-9]{5}$/, 'Solo números'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional(),
})

export type IssuingProfileFormValues = z.infer<typeof issuingProfileFormSchema>
