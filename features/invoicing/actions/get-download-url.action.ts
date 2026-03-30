'use server'

import { auth } from '@clerk/nextjs/server'
import { getFileSignedUrl } from '@features/storage/services/r2.service'

export async function getInvoiceDownloadUrlAction(key: string) {
  const { userId } = await auth()

  if (!userId) {
    return { url: null, error: 'No autorizado' }
  }

  // Verify the key belongs to this user
  if (!key.includes(userId)) {
    return { url: null, error: 'No autorizado' }
  }

  try {
    const url = await getFileSignedUrl(key)
    return { url }
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return { url: null, error: 'Error al generar URL de descarga' }
  }
}
