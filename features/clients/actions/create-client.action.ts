'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '../services/client.service'
import type { CreateClientInput } from '../types/client.types'

/**
 * Server Action: Create client
 */
export async function createClientAction(data: CreateClientInput) {
  const { userId } = await auth()

  if (!userId) {
    return {
      success: false,
      error: 'No autenticado',
    }
  }

  try {
    const client = await createClient(userId, data)

    revalidatePath('/clients')

    return {
      success: true,
      data: client
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client'
    }
  }
}
