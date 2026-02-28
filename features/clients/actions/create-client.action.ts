'use server'

import { createClient } from '../services/client.service'
import type { CreateClientInput } from '../types/client.types'

/**
 * Server Action: Create client
 */
export async function createClientAction(data: CreateClientInput) {
  // TODO: Get current user from Supabase auth
  const userId = 'temp-user-id' // Placeholder
  
  try {
    const client = await createClient(userId, data)
    
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
