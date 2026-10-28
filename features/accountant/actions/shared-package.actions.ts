'use server'

import { resolveAccountantToken } from '../services/accountant-link.service'
import { createMonthZip, getMonthCsv } from '../services/month-package.service'

/**
 * Downloads from the accountant's page, without a session: every call checks the token again,
 * so a cancelled link stops working even on a page that was already open.
 */

const GONE = 'Este link ya no funciona. Pídele uno nuevo a tu cliente.'

export async function downloadSharedZipAction(token: string, month: string) {
  const owner = await resolveAccountantToken(token)
  if (!owner) return { success: false as const, error: GONE }
  try {
    return { success: true as const, ...(await createMonthZip(owner.userId, owner.profileId, month)) }
  } catch {
    return { success: false as const, error: 'No pudimos armar el paquete. Intenta de nuevo en un momento.' }
  }
}

export async function downloadSharedCsvAction(token: string, month: string) {
  const owner = await resolveAccountantToken(token)
  if (!owner) return { success: false as const, error: GONE }
  try {
    return { success: true as const, ...(await getMonthCsv(owner.userId, owner.profileId, month)) }
  } catch {
    return { success: false as const, error: 'No pudimos armar el resumen. Intenta de nuevo en un momento.' }
  }
}
