import { z } from 'zod'
import { isValidClabe, normalizeClabe } from '../utils/clabe'

/**
 * "Para que te paguen": CLABE, bank and payment link, all optional. Shared by the profile form
 * and the server actions; an empty field means "none".
 */
export const paymentDetailsSchema = z.object({
  clabe: z
    .string()
    .transform(normalizeClabe)
    .superRefine((clabe, ctx) => {
      if (clabe === '') return
      if (clabe.length !== 18) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La CLABE tiene 18 dígitos' })
      } else if (!isValidClabe(clabe)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Revisa la CLABE: el último dígito no coincide con los demás' })
      }
    }),
  bankName: z.string().trim().max(60, 'Usa máximo 60 caracteres'),
  paymentLink: z
    .string()
    .trim()
    .max(300, 'Usa un link más corto')
    .refine((link) => link === '' || /^https:\/\/[^\s/$.?#].\S*$/i.test(link), 'El link debe empezar con https://'),
})

export type PaymentDetailsValues = z.infer<typeof paymentDetailsSchema>

/** What the actions save: validated, and null where the user left the field empty. */
export function parsePaymentDetails(input: { clabe?: string | null; bankName?: string | null; paymentLink?: string | null }) {
  const parsed = paymentDetailsSchema.safeParse({
    clabe: input.clabe ?? '',
    bankName: input.bankName ?? '',
    paymentLink: input.paymentLink ?? '',
  })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Revisa los datos para que te paguen')
  const { clabe, bankName, paymentLink } = parsed.data
  return { clabe: clabe || null, bankName: bankName || null, paymentLink: paymentLink || null }
}
