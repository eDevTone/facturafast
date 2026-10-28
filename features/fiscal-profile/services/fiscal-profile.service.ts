import { eq, and, ne, sql } from 'drizzle-orm'
import { db } from '@database/client'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'
import type {
  CreateIssuingProfileInput,
  IssuingProfile,
  UpdateIssuingProfileInput,
} from '../types/fiscal-profile.types'

/**
 * Columns safe to send to the browser. The CSD (.cer, .key) and its encrypted
 * password never leave the server; `hasCsd` tells the UI whether they exist.
 */
const publicColumns = {
  id: issuingProfiles.id,
  userId: issuingProfiles.userId,
  rfc: issuingProfiles.rfc,
  businessName: issuingProfiles.businessName,
  taxRegime: issuingProfiles.taxRegime,
  postalCode: issuingProfiles.postalCode,
  email: issuingProfiles.email,
  phone: issuingProfiles.phone,
  isDefault: issuingProfiles.isDefault,
  logoUrl: issuingProfiles.logoUrl,
  bankName: issuingProfiles.bankName,
  clabe: issuingProfiles.clabe,
  paymentLink: issuingProfiles.paymentLink,
  autoReminders: issuingProfiles.autoReminders,
  cerFilename: issuingProfiles.cerFilename,
  keyFilename: issuingProfiles.keyFilename,
  certSerialNumber: issuingProfiles.certSerialNumber,
  certValidFrom: issuingProfiles.certValidFrom,
  certValidUntil: issuingProfiles.certValidUntil,
  createdAt: issuingProfiles.createdAt,
  updatedAt: issuingProfiles.updatedAt,
  hasCsd: sql<boolean>`(${issuingProfiles.cerBase64} IS NOT NULL AND ${issuingProfiles.keyBase64} IS NOT NULL AND ${issuingProfiles.keyPassword} IS NOT NULL)`,
}

export async function getAllIssuingProfiles(userId: string) {
  return db
    .select(publicColumns)
    .from(issuingProfiles)
    .where(eq(issuingProfiles.userId, userId))
    .orderBy(issuingProfiles.createdAt)
}

export async function getDefaultIssuingProfile(userId: string) {
  const results = await db
    .select(publicColumns)
    .from(issuingProfiles)
    .where(and(eq(issuingProfiles.userId, userId), eq(issuingProfiles.isDefault, true)))
    .limit(1)
  return results[0] ?? null
}

export async function getIssuingProfileById(id: string, userId: string) {
  const results = await db
    .select(publicColumns)
    .from(issuingProfiles)
    .where(and(eq(issuingProfiles.id, id), eq(issuingProfiles.userId, userId)))
    .limit(1)
  return results[0] ?? null
}

/**
 * Full row including the CSD and its encrypted password.
 * Server-only: use it for sealing, stamping and cancelling, never pass it to a component.
 */
export async function getIssuingProfileWithSecrets(
  id: string,
  userId: string,
): Promise<IssuingProfile | null> {
  const results = await db
    .select()
    .from(issuingProfiles)
    .where(and(eq(issuingProfiles.id, id), eq(issuingProfiles.userId, userId)))
    .limit(1)
  return results[0] ?? null
}

export async function createIssuingProfile(
  userId: string,
  input: CreateIssuingProfileInput,
) {
  // First profile created → set as default automatically
  const existing = await getAllIssuingProfiles(userId)
  const isFirst = existing.length === 0

  const [created] = await db
    .insert(issuingProfiles)
    .values({
      userId,
      rfc: input.rfc.toUpperCase(),
      businessName: input.businessName,
      taxRegime: input.taxRegime,
      postalCode: input.postalCode,
      email: input.email,
      phone: input.phone,
      isDefault: isFirst,
      cerFilename: input.cerFilename,
      cerBase64: input.cerBase64,
      keyFilename: input.keyFilename,
      keyBase64: input.keyBase64,
      keyPassword: input.keyPassword,
      certSerialNumber: input.certSerialNumber,
      certValidFrom: input.certValidFrom,
      certValidUntil: input.certValidUntil,
      logoUrl: input.logoUrl,
      bankName: input.bankName,
      clabe: input.clabe,
      paymentLink: input.paymentLink,
      autoReminders: input.autoReminders ?? false,
    })
    .returning(publicColumns)

  return created
}

export async function updateIssuingProfile(
  id: string,
  userId: string,
  input: UpdateIssuingProfileInput,
) {
  const [updated] = await db
    .update(issuingProfiles)
    .set({
      ...input,
      rfc: input.rfc ? input.rfc.toUpperCase() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(issuingProfiles.id, id), eq(issuingProfiles.userId, userId)))
    .returning(publicColumns)
  return updated
}

export async function updateCertificates(
  id: string,
  userId: string,
  data: {
    cerFilename: string
    cerBase64: string
    keyFilename: string
    keyBase64: string
    keyPassword: string
    certSerialNumber: string
    certValidFrom: string
    certValidUntil: string
  },
) {
  const [updated] = await db
    .update(issuingProfiles)
    .set({
      cerFilename: data.cerFilename,
      cerBase64: data.cerBase64,
      keyFilename: data.keyFilename,
      keyBase64: data.keyBase64,
      keyPassword: data.keyPassword,
      certSerialNumber: data.certSerialNumber,
      certValidFrom: data.certValidFrom,
      certValidUntil: data.certValidUntil,
      updatedAt: new Date(),
    })
    .where(and(eq(issuingProfiles.id, id), eq(issuingProfiles.userId, userId)))
    .returning(publicColumns)
  return updated
}

export async function setDefaultIssuingProfile(id: string, userId: string) {
  // Remove default from all others
  await db
    .update(issuingProfiles)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(and(eq(issuingProfiles.userId, userId), ne(issuingProfiles.id, id)))

  // Set target as default
  await db
    .update(issuingProfiles)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(issuingProfiles.id, id), eq(issuingProfiles.userId, userId)))
}

export async function deleteIssuingProfile(id: string, userId: string) {
  const profile = await getIssuingProfileById(id, userId)
  if (!profile) throw new Error('Perfil no encontrado')

  await db
    .delete(issuingProfiles)
    .where(and(eq(issuingProfiles.id, id), eq(issuingProfiles.userId, userId)))

  // If deleted was default, promote the most recent one
  if (profile.isDefault) {
    const remaining = await getAllIssuingProfiles(userId)
    if (remaining.length > 0) {
      await setDefaultIssuingProfile(remaining[0].id, userId)
    }
  }
}
