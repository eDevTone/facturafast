'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClientFormSchema, type ClientFormData } from '../schemas/client-form.schema'
import { createClient } from '../services/client.service'

/**
 * Server Action: Create client
 */
export async function createClientAction(data: ClientFormData) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: 'No autenticado',
    }
  }

  const parsed = createClientFormSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Revisa los datos del cliente' }
  }

  try {
    const client = await createClient(userId, parsed.data)

    revalidatePath('/clients')

    return {
      success: true,
      data: client
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar el cliente'
    }
  }
}
