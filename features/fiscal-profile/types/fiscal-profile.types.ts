import type { IssuingProfile } from '@database/schemas'

export type { IssuingProfile }

/**
 * Issuing profile as the browser sees it: no CSD files, no password.
 * `hasCsd` says whether the .cer, .key and password are stored.
 */
export type PublicIssuingProfile = Omit<IssuingProfile, 'cerBase64' | 'keyBase64' | 'keyPassword'> & {
  hasCsd: boolean
}

export interface CreateIssuingProfileInput {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  email: string
  phone?: string
  logoFile?: File
  logoUrl?: string
  /** "Para que te paguen"; null clears it. */
  bankName?: string | null
  clabe?: string | null
  paymentLink?: string | null
  /** Email the client when an invoice falls due, and a week later. */
  autoReminders?: boolean
  cerFilename?: string
  cerBase64?: string
  keyFilename?: string
  keyBase64?: string
  keyPassword?: string
  certSerialNumber?: string
  certValidFrom?: string
  certValidUntil?: string
}

export type UpdateIssuingProfileInput = Partial<CreateIssuingProfileInput>

/** True when the full row carries the .cer, the .key and the encrypted password. */
export function profileHasCSD(profile: IssuingProfile): boolean {
  return !!(profile.cerBase64 && profile.keyBase64 && profile.keyPassword)
}

export function isCertExpired(profile: Pick<IssuingProfile, 'certValidUntil'>): boolean {
  if (!profile.certValidUntil) return false
  return new Date(profile.certValidUntil) < new Date()
}
