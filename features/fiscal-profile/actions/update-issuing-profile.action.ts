'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { updateIssuingProfile, setDefaultIssuingProfile } from '../services/fiscal-profile.service'
import { processCertificates } from '../services/certificate.service'
import type { UpdateIssuingProfileInput } from '../types/fiscal-profile.types'

export async function updateIssuingProfileAction(id: string, input: UpdateIssuingProfileInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  // Si se subieron certificados nuevos, procesarlos
  if (input.cerBase64 && input.keyBase64 && input.keyPassword) {
    const certResult = processCertificates(input.cerBase64, input.keyBase64, input.keyPassword)

    input.certSerialNumber = certResult.certSerialNumber
    input.certValidFrom = certResult.certValidFrom
    input.certValidUntil = certResult.certValidUntil
    input.keyPassword = certResult.encryptedKeyPassword

    // TODO: Validar coincidencia de RFC certificado vs perfil al integrar PAC
    // El .cer del SAT a veces contiene el RFC del representante legal, no el de la empresa
  }

  const profile = await updateIssuingProfile(id, userId, input)
  revalidatePath('/fiscal-profiles')
  return profile
}

export async function setDefaultIssuingProfileAction(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  await setDefaultIssuingProfile(id, userId)
  revalidatePath('/fiscal-profiles')
}
