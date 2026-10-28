import { z } from 'zod'

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/

/**
 * What a client types on the page of "Pedir datos a un cliente": a client in México, with the
 * email their invoices go to. The server checks it again with the client form's schema.
 */
export const publicClientSchema = z.object({
  rfc: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => RFC_PATTERN.test(value), 'Revisa tu RFC: 12 caracteres para una empresa, 13 para una persona'),
  businessName: z
    .string()
    .trim()
    .min(1, 'Escribe tu nombre o razón social')
    .max(300, 'Usa un nombre más corto')
    .refine((value) => !value.includes('|'), 'El nombre no puede llevar el carácter |'),
  taxRegime: z.string().min(1, 'Elige tu régimen fiscal'),
  postalCode: z.string().regex(/^\d{5}$/, 'El código postal tiene 5 dígitos'),
  cfdiUsage: z.string().min(1, 'Elige el uso del CFDI'),
  email: z.string().trim().email('Escribe un correo válido'),
  phone: z.string().trim().max(20, 'Usa máximo 20 caracteres').optional(),
})

export type PublicClientValues = z.infer<typeof publicClientSchema>
