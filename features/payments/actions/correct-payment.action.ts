'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { registerPaymentSchema, type RegisterPaymentFormData } from '../schemas/payment-form.schema'
import { correctPayment } from '../services/payment.service'

/** "Corregir cobro": stamps a complemento that replaces the last one and asks the SAT to cancel the old one. */
export async function correctPaymentAction(paymentId: string, input: RegisterPaymentFormData) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  const parsed = registerPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Revisa los datos del cobro' }
  }

  try {
    const result = await correctPayment(userId, paymentId, parsed.data)

    // Also on failure: an unconfirmed payment is kept and must show up.
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${parsed.data.invoiceId}`)

    if (!result.success) {
      return { success: false as const, error: result.error, code: result.code }
    }
    return { success: true as const, uuid: result.uuid, replacement: result.replacement }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al corregir el cobro',
      code: undefined,
    }
  }
}
