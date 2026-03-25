import type { IssuingProfile } from '@database/schemas'

export type { IssuingProfile }

export interface CreateIssuingProfileInput {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  email: string
  phone?: string
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

export const TAX_REGIME_OPTIONS = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '625', label: '625 - Actividades Empresariales RESICO' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
] as const

export function profileHasCSD(profile: IssuingProfile): boolean {
  return !!(profile.cerBase64 && profile.keyBase64 && profile.keyPassword)
}

export function isCertExpired(profile: IssuingProfile): boolean {
  if (!profile.certValidUntil) return false
  return new Date(profile.certValidUntil) < new Date()
}
