'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClientFormSchema } from '../schemas/client-form.schema'
import { updateClient } from '../services/client.service'

export async function updateClientAction(id: string, formData: FormData) {
  const { userId } = await auth()

  if (!userId) {
    return { success: false as const, error: 'No autorizado' }
  }

  const data = {
    rfc: formData.get('rfc') as string,
    businessName: formData.get('businessName') as string,
    email: (formData.get('email') as string) || '',
    phone: (formData.get('phone') as string) || '',
    postalCode: formData.get('postalCode') as string,
    taxRegime: (formData.get('taxRegime') as string) || '',
    cfdiUsage: (formData.get('cfdiUsage') as string) || '',
  }

  const validation = createClientFormSchema.safeParse(data)

  if (!validation.success) {
    return {
      success: false as const,
      error: 'Datos inválidos',
      fieldErrors: validation.error.flatten().fieldErrors,
    }
  }

  try {
    await updateClient(id, userId, validation.data)
    revalidatePath('/clients')
    return { success: true as const }
  } catch (error) {
    console.error('Error updating client:', error)
    return {
      success: false as const,
      error: 'Error al actualizar el cliente',
    }
  }
}
