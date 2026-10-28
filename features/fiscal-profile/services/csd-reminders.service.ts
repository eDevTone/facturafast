import { db } from '@database/client'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'
import { sendCsdExpiringEmail } from '@features/notifications/services/email.service'
import { appUrl } from '@shared/utils/app-url'
import { formatDateLong } from '@shared/utils/date'
import { and, isNotNull } from 'drizzle-orm'

import { CSD_REMINDER_DAYS, CSD_REQUEST_URL, csdDaysLeftLabel, csdExpiry } from '../utils/csd-expiry'

export interface CsdReminder {
  profileId: string
  rfc: string
  email: string
  validUntil: string
  daysLeft: number
}

/**
 * The CSDs with exactly one of `CSD_REMINDER_DAYS` left on `today` (a Mexico City day). Each one
 * matches on a single day, so a CSD gets each reminder once without storing that it was sent.
 */
export async function dueCsdReminders(today: string): Promise<CsdReminder[]> {
  const rows = await db
    .select({
      id: issuingProfiles.id,
      rfc: issuingProfiles.rfc,
      email: issuingProfiles.email,
      certValidUntil: issuingProfiles.certValidUntil,
    })
    .from(issuingProfiles)
    .where(and(
      isNotNull(issuingProfiles.cerBase64),
      isNotNull(issuingProfiles.keyBase64),
      isNotNull(issuingProfiles.keyPassword),
      isNotNull(issuingProfiles.certValidUntil),
    ))

  // Midday in Mexico City, so `today` is the day csdExpiry counts from.
  const now = new Date(`${today}T18:00:00Z`)
  return rows.flatMap((row) => {
    const expiry = csdExpiry(row.certValidUntil, now)
    if (expiry.state !== 'por_vencer' || !CSD_REMINDER_DAYS.includes(expiry.daysLeft)) return []
    return [{ profileId: row.id, rfc: row.rfc, email: row.email, validUntil: row.certValidUntil!, daysLeft: expiry.daysLeft }]
  })
}

/** The daily cron's CSD reminders. A failed email does not stop the others. */
export async function sendCsdExpiryReminders(today: string) {
  const results: { profileId: string; daysLeft: number; sent: boolean; error?: string }[] = []
  for (const reminder of await dueCsdReminders(today)) {
    try {
      await sendCsdExpiringEmail({
        to: reminder.email,
        rfc: reminder.rfc,
        daysLeftLabel: csdDaysLeftLabel(reminder.daysLeft),
        lastDayLabel: formatDateLong(reminder.validUntil),
        profilesUrl: appUrl('/fiscal-profiles'),
        requestUrl: CSD_REQUEST_URL,
      })
      results.push({ profileId: reminder.profileId, daysLeft: reminder.daysLeft, sent: true })
    } catch (error) {
      results.push({
        profileId: reminder.profileId,
        daysLeft: reminder.daysLeft,
        sent: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return results
}
