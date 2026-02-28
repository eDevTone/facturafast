'use server'

import { createInvoice } from '../services/invoice.service'
import type { CreateInvoiceInput } from '../types/invoice.types'

/**
 * Server Action: Create invoice
 */
export async function createInvoiceAction(data: CreateInvoiceInput) {
  // TODO: Get current user from Supabase auth
  const userId = 'temp-user-id' // Placeholder
  
  try {
    const invoice = await createInvoice(userId, data)
    
    return {
      success: true,
      data: invoice
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invoice'
    }
  }
}
