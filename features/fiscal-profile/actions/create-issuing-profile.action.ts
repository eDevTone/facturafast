'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { assertTaxRegimeFitsRfc } from '@shared/services/sat-catalog.service'
import { createIssuingProfile } from '../services/fiscal-profile.service'
import { processCertificates } from '../services/certificate.service'
import { parsePaymentDetails } from '../schemas/payment-details.schema'
import type { CreateIssuingProfileInput } from '../types/fiscal-profile.types'

/**
 * Saves a new issuing profile. A problem comes back as `{ error }`, not thrown: in production
 * Next.js hides a thrown message, and the form must show it ("Verifica la contraseña").
 */
export async function createIssuingProfileAction(input: CreateIssuingProfileInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Tu sesión terminó. Vuelve a entrar.' }

  try {
    Object.assign(input, parsePaymentDetails(input))
    await assertTaxRegimeFitsRfc(input.taxRegime, input.rfc)

    // Si se subieron certificados, procesarlos
    if (input.cerBase64 && input.keyBase64 && input.keyPassword) {
      const certResult = processCertificates(input.cerBase64, input.keyBase64, input.keyPassword)

      input.certSerialNumber = certResult.certSerialNumber
      input.certValidFrom = certResult.certValidFrom
      input.certValidUntil = certResult.certValidUntil
      input.keyPassword = certResult.encryptedKeyPassword

      // TODO: Validar coincidencia de RFC certificado vs perfil al integrar PAC
      // El .cer del SAT a veces contiene el RFC del representante legal, no el de la empresa
    }

    const profile = await createIssuingProfile(userId, input)
    revalidatePath('/fiscal-profiles')
    return { profile }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se pudo guardar el perfil.' }
  }
}
