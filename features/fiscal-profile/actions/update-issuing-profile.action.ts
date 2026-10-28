'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { assertTaxRegimeFitsRfc } from '@shared/services/sat-catalog.service'
import { getIssuingProfileById, updateIssuingProfile, setDefaultIssuingProfile } from '../services/fiscal-profile.service'
import { processCertificates } from '../services/certificate.service'
import { parsePaymentDetails } from '../schemas/payment-details.schema'
import type { UpdateIssuingProfileInput } from '../types/fiscal-profile.types'

/** Saves changes to an issuing profile; like creating one, a problem comes back as `{ error }`. */
export async function updateIssuingProfileAction(id: string, input: UpdateIssuingProfileInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Tu sesión terminó. Vuelve a entrar.' }

  try {
    // Only the profile form sends the payment details; other updates leave them as they are.
    if ('clabe' in input || 'bankName' in input || 'paymentLink' in input) {
      Object.assign(input, parsePaymentDetails(input))
    }

    // The régimen must fit the RFC, whichever of the two changes.
    if (input.rfc || input.taxRegime) {
      const current = input.rfc && input.taxRegime ? null : await getIssuingProfileById(id, userId)
      await assertTaxRegimeFitsRfc(input.taxRegime ?? current?.taxRegime ?? '', input.rfc ?? current?.rfc ?? '')
    }

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
    return { profile }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se guardaron los cambios.' }
  }
}

export async function setDefaultIssuingProfileAction(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  await setDefaultIssuingProfile(id, userId)
  revalidatePath('/fiscal-profiles')
}
