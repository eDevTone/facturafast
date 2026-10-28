'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createInvoiceFormSchema } from '@features/invoicing/schemas/invoice-form.schema'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import {
  createRecurringInvoice,
  deleteRecurringInvoice,
  setRecurringActive,
  updateRecurringSettings,
  updateRecurringTemplate,
  type RecurringSettings,
} from '../services/recurring.service'

const LIST_PATH = '/invoices/recurring'

function failure(error: unknown, fallback: string) {
  return { success: false as const, error: error instanceof Error ? error.message : fallback }
}

/** "Repetir cada mes" on an invoice. */
export async function createRecurringInvoiceAction(invoiceId: string, settings: RecurringSettings) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    const recurring = await createRecurringInvoice(invoiceId, userId, settings, todayInMexico())
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath(LIST_PATH)
    return { success: true as const, recurring }
  } catch (error) {
    return failure(error, 'No se pudo programar la factura')
  }
}

/** Day of the month, what to do and which month the descriptions name. */
export async function updateRecurringSettingsAction(id: string, settings: RecurringSettings) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    const recurring = await updateRecurringSettings(id, userId, settings, todayInMexico())
    revalidatePath(LIST_PATH)
    revalidatePath('/invoices', 'layout')
    return { success: true as const, recurring }
  } catch (error) {
    return failure(error, 'No se guardaron los cambios')
  }
}

/** "Pausar" (false) or "Reanudar" (true). */
export async function setRecurringActiveAction(id: string, active: boolean) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    const recurring = await setRecurringActive(id, userId, active, todayInMexico())
    revalidatePath(LIST_PATH)
    revalidatePath('/invoices', 'layout')
    return { success: true as const, recurring }
  } catch (error) {
    return failure(error, 'No se guardaron los cambios')
  }
}

/** "Dejar de repetir": the invoices it made stay as they are. */
export async function deleteRecurringInvoiceAction(id: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    await deleteRecurringInvoice(id, userId)
    revalidatePath(LIST_PATH)
    revalidatePath('/invoices', 'layout')
    return { success: true as const }
  } catch (error) {
    return failure(error, 'No se pudo borrar')
  }
}

/** "Cambiar conceptos": the invoice form, saved as the template. */
export async function updateRecurringTemplateAction(id: string, data: unknown) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  const parsed = createInvoiceFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  try {
    await updateRecurringTemplate(id, userId, parsed.data)
    revalidatePath(LIST_PATH)
    return { success: true as const }
  } catch (error) {
    return failure(error, 'No se guardaron los conceptos')
  }
}
