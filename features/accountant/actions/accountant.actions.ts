'use server'

import { auth } from '@clerk/nextjs/server'
import { getAllIssuingProfiles, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import {
  createAccountantLink,
  getAccountantLink,
  revokeAccountantLink,
} from '../services/accountant-link.service'
import { createMonthZip, getMonthCounts, getMonthCsv, withCounts } from '../services/month-package.service'
import { recentMonths } from '../utils/month'

/** Months the dialog offers: the last year. */
const RECENT_MONTHS = 12

function failure(error: unknown, fallback: string) {
  return { success: false as const, error: error instanceof Error ? error.message : fallback }
}

/** What "Para tu contador" shows for a profile: its months with how many CFDI each has, and its link. */
export async function getAccountantPanelAction(profileId?: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    const [profiles, defaultProfile] = await Promise.all([getAllIssuingProfiles(userId), getDefaultIssuingProfile(userId)])
    const selected = profiles.find((profile) => profile.id === profileId) ?? defaultProfile ?? profiles[0]
    if (!selected) return { success: false as const, error: 'Primero registra tu perfil fiscal.' }

    const [counts, link] = await Promise.all([getMonthCounts(userId, selected.id), getAccountantLink(userId, selected.id)])
    return {
      success: true as const,
      profiles: profiles.map((profile) => ({ id: profile.id, rfc: profile.rfc, businessName: profile.businessName })),
      profileId: selected.id,
      months: withCounts(recentMonths(todayInMexico(), RECENT_MONTHS), counts),
      link,
    }
  } catch (error) {
    return failure(error, 'No pudimos cargar tus meses')
  }
}

/** "Descargar ZIP": a signed URL that lasts 10 minutes. */
export async function downloadMonthZipAction(profileId: string, month: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    return { success: true as const, ...(await createMonthZip(userId, profileId, month)) }
  } catch (error) {
    return failure(error, 'No pudimos armar el paquete')
  }
}

/** "Solo el resumen": the CSV text, saved by the browser. */
export async function downloadMonthCsvAction(profileId: string, month: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    return { success: true as const, ...(await getMonthCsv(userId, profileId, month)) }
  } catch (error) {
    return failure(error, 'No pudimos armar el resumen')
  }
}

/** "Crear link" and "Crear uno nuevo": the previous link stops working. */
export async function createAccountantLinkAction(profileId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    return { success: true as const, link: await createAccountantLink(userId, profileId) }
  } catch (error) {
    return failure(error, 'No pudimos crear el link')
  }
}

/** "Cancelar link". */
export async function revokeAccountantLinkAction(profileId: string) {
  const { userId } = await auth()
  if (!userId) return { success: false as const, error: 'No autorizado' }

  try {
    await revokeAccountantLink(userId, profileId)
    return { success: true as const }
  } catch (error) {
    return failure(error, 'No pudimos cancelar el link')
  }
}
