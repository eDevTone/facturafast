import { z } from 'zod'

/** "Registrar cobro": shared by the dialog and the server action. */
export const registerPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha en que te pagaron'),
  paymentForm: z
    .string()
    .regex(/^\d{2}$/, 'Elige cómo te pagaron')
    .refine((value) => value !== '99', 'Elige cómo te pagaron; "Por definir" no aplica a un cobro'),
  amount: z
    .number({ invalid_type_error: 'Escribe el monto' })
    .positive('El monto debe ser mayor que cero')
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'Usa máximo dos decimales'),
  operationNumber: z
    .string()
    .trim()
    .max(100, 'Usa máximo 100 caracteres')
    .refine((value) => !value.includes('|'), 'No uses el carácter |')
    .optional(),
  /** TipoCambioP of a payment in dollars: pesos per dollar on the payment day. */
  exchangeRate: z.number().positive('Escribe el tipo de cambio').max(1_000_000, 'Revisa el tipo de cambio').nullable().optional(),
})

export type RegisterPaymentFormData = z.infer<typeof registerPaymentSchema>
