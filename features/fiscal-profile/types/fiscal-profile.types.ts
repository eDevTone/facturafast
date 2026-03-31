import type { IssuingProfile } from '@database/schemas'

export type { IssuingProfile }

export interface CreateIssuingProfileInput {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  email: string
  phone?: string
  logoFile?: File
  logoUrl?: string
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

export function profileHasCSD(profile: IssuingProfile): boolean {
  return !!(profile.cerBase64 && profile.keyBase64 && profile.keyPassword)
}

export function isCertExpired(profile: IssuingProfile): boolean {
  if (!profile.certValidUntil) return false
  return new Date(profile.certValidUntil) < new Date()
}
