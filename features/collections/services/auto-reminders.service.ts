import { db } from '@database/client'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'
import { paymentReminders } from '@database/schemas/payment-reminders.schema'
import { getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getInvoiceById } from '@features/invoicing/services/invoice.service'
import { stampedTotal } from '@features/payments/services/payment.service'
import { daysBetween } from '@shared/utils/day'
import { desc, eq } from 'drizzle-orm'
import { reminderMessage } from '../utils/reminder-message'
import { getOwedInvoices, sendReminderEmail } from './collection.service'

/** No automatic reminder within this many days of any other one, manual or automatic. */
const QUIET_DAYS = 3

/**
 * Days late in which each automatic reminder goes out: the first from the day after the due date,
 * the second a week later. A window, not a single day, so a missed cron run is made up the next day.
 */
const WINDOWS = [
  { from: 1, to: 7 },
  { from: 8, to: 14 },
] as const

export interface AutomaticReminderResult {
  invoiceId: string
  userId: string
  sent: boolean
  error?: string
}

/**
 * Recordatorios automáticos (6.6), for the profiles that turned them on: the suggested reminder,
 * by email, on overdue invoices whose client has an email. Two per invoice at most.
 */
export async function sendAutomaticReminders(today: string): Promise<AutomaticReminderResult[]> {
  const profiles = await db
    .select({ id: issuingProfiles.id, userId: issuingProfiles.userId })
    .from(issuingProfiles)
    .where(eq(issuingProfiles.autoReminders, true))

  const profilesByUser = new Map<string, Set<string>>()
  for (const profile of profiles) {
    const set = profilesByUser.get(profile.userId) ?? new Set<string>()
    set.add(profile.id)
    profilesByUser.set(profile.userId, set)
  }

  const results: AutomaticReminderResult[] = []
  for (const [userId, profileIds] of profilesByUser) {
    for (const owed of await getOwedInvoices(userId, today)) {
      if (!owed.issuingProfileId || !profileIds.has(owed.issuingProfileId)) continue
      if (owed.state.status !== 'vencida' || !owed.state.dueDate) continue

      const late = daysBetween(owed.state.dueDate, today)
      const reminders = await db
        .select({ automatic: paymentReminders.automatic, createdAt: paymentReminders.createdAt })
        .from(paymentReminders)
        .where(eq(paymentReminders.invoiceId, owed.id))
        .orderBy(desc(paymentReminders.createdAt))
      const sentSoFar = reminders.filter((reminder) => reminder.automatic).length
      const window = WINDOWS[sentSoFar]
      if (!window || late < window.from || late > window.to) continue
      const quietSince = Date.parse(`${today}T12:00:00Z`) - QUIET_DAYS * 86_400_000
      if (reminders[0] && reminders[0].createdAt.getTime() > quietSince) continue

      const invoice = await getInvoiceById(owed.id, userId)
      if (!invoice?.client.email || !invoice.issuingProfileId) continue
      const profile = await getIssuingProfileById(invoice.issuingProfileId, userId)
      const message = reminderMessage({
        invoiceLabel: `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`,
        currency: invoice.currency,
        total: stampedTotal(invoice),
        balance: owed.state.balance,
        dueDate: owed.state.dueDate,
        today,
        payment: profile
          ? { bankName: profile.bankName, clabe: profile.clabe, paymentLink: profile.paymentLink, holder: profile.businessName }
          : null,
      })

      try {
        await sendReminderEmail(invoice.id, userId, message, { automatic: true })
        results.push({ invoiceId: invoice.id, userId, sent: true })
      } catch (error) {
        results.push({ invoiceId: invoice.id, userId, sent: false, error: error instanceof Error ? error.message : String(error) })
      }
    }
  }
  return results
}
