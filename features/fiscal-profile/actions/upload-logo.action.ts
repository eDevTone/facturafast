'use server'

import { auth } from '@clerk/nextjs/server'
import { uploadRawFile } from '@features/storage/services/r2.service'

export async function uploadLogoAction(formData: FormData): Promise<{ logoUrl: string } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'No autorizado' }

  const file = formData.get('logo') as File | null
  if (!file || file.size === 0) return { error: 'No se recibió archivo' }

  if (!file.type.startsWith('image/')) return { error: 'Solo se permiten imágenes' }
  if (file.size > 2 * 1024 * 1024) return { error: 'La imagen no debe superar 2MB' }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type.includes('png') ? 'png' : 'jpg'
  const key = `logos/${userId}/${Date.now()}.${ext}`

  const logoUrl = await uploadRawFile(key, buffer, file.type)

  return { logoUrl }
}
