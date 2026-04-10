'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { processCertificates } from '../services/certificate.service'
import {
  getIssuingProfileById,
  updateCertificates,
} from '../services/fiscal-profile.service'

interface UploadCertificatesInput {
  profileId: string
  cerFilename: string
  cerBase64: string
  keyFilename: string
  keyBase64: string
  keyPassword: string
}

export async function uploadCertificatesAction(
  input: UploadCertificatesInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'No autorizado' }

    const profile = await getIssuingProfileById(input.profileId, userId)
    if (!profile) return { success: false, error: 'Perfil no encontrado' }

    const certResult = processCertificates(
      input.cerBase64,
      input.keyBase64,
      input.keyPassword,
    )

    await updateCertificates(input.profileId, userId, {
      cerFilename: input.cerFilename,
      cerBase64: input.cerBase64,
      keyFilename: input.keyFilename,
      keyBase64: input.keyBase64,
      keyPassword: certResult.encryptedKeyPassword,
      certSerialNumber: certResult.certSerialNumber,
      certValidFrom: certResult.certValidFrom,
      certValidUntil: certResult.certValidUntil,
    })

    revalidatePath('/fiscal-profiles')
    revalidatePath('/invoices', 'layout')

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al procesar certificados',
    }
  }
}
