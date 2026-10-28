'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { refreshPendingCancellations } from '../services/cancellation.service'

/** Run by the invoice list in the background: updates pending cancellations the SAT already resolved. */
export async function refreshPendingCancellationsAction() {
  const { userId } = await auth()
  if (!userId) return { changed: 0 }

  try {
    const changed = await refreshPendingCancellations(userId)
    if (changed > 0) revalidatePath('/invoices')
    return { changed }
  } catch (error) {
    console.error('[cancel] Pending refresh failed:', error instanceof Error ? error.message : error)
    return { changed: 0 }
  }
}
