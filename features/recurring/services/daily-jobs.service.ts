import { db } from '@database/client'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'
import { sendAutomaticReminders } from '@features/collections/services/auto-reminders.service'
import { sendCsdExpiryReminders } from '@features/fiscal-profile/services/csd-reminders.service'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import type { RecurringDigestRow } from '@features/notifications/email/templates/recurring-digest'
import { sendRecurringDigestEmail } from '@features/notifications/services/email.service'
import { formatDayLong } from '@features/payments/utils/payment-dates'
import { appUrl } from '@shared/utils/app-url'
import { desc, eq } from 'drizzle-orm'
import { runDueRecurringInvoices, type RecurringRun } from './recurring.service'

const LIST_PATH = '/invoices/recurring'

/** One line of the daily email; nothing for a month that already had its invoice. */
function digestRow(run: RecurringRun): RecurringDigestRow | null {
  const { outcome, invoice, clientName } = run
  if (outcome.kind === 'already') return null

  const made = invoice
    ? {
        folioLabel: `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`,
        total: formatCurrency(Number(invoice.total), invoice.currency),
        url: appUrl(`/invoices/${invoice.id}`),
      }
    : { folioLabel: null, total: null, url: appUrl(LIST_PATH) }

  switch (outcome.kind) {
    case 'draft':
      return { ...made, clientName, status: 'Borrador listo: revísalo y timbra.', tone: 'todo', action: 'Revisar y timbrar' }
    case 'stamped':
      return { ...made, clientName, status: 'Timbrada y enviada a tu cliente.', tone: 'done', action: 'Ver factura' }
    case 'no_stamps':
      return { ...made, clientName, status: 'No te quedan timbres, así que quedó como borrador. Compra timbres y tímbrala.', tone: 'problem', action: 'Ver borrador' }
    case 'stamp_failed':
      return { ...made, clientName, status: `No se pudo timbrar y quedó como borrador. ${outcome.error}`, tone: 'problem', action: 'Ver borrador' }
    case 'paused': {
      const reason = /perfil/i.test(outcome.error) ? 'tu perfil fiscal ya no existe' : 'el cliente ya no existe'
      return { ...made, clientName, status: `La pausamos porque ${reason}.`, tone: 'problem', action: 'Ver facturas de cada mes' }
    }
    case 'error':
      return { ...made, clientName, status: `No se pudo hacer: ${outcome.error} Lo intentamos de nuevo mañana.`, tone: 'problem', action: 'Ver facturas de cada mes' }
  }
}

/** The email of a user's default profile (or any of them): where their daily note goes. */
async function userEmail(userId: string): Promise<string | null> {
  const [profile] = await db
    .select({ email: issuingProfiles.email })
    .from(issuingProfiles)
    .where(eq(issuingProfiles.userId, userId))
    .orderBy(desc(issuingProfiles.isDefault))
    .limit(1)
  return profile?.email ?? null
}

/** One email per user with today's rows. A failed email does not stop the others. */
async function sendDigests(runs: RecurringRun[], today: string) {
  const rowsByUser = new Map<string, RecurringDigestRow[]>()
  for (const run of runs) {
    const row = digestRow(run)
    if (!row) continue
    rowsByUser.set(run.userId, [...(rowsByUser.get(run.userId) ?? []), row])
  }

  const results: { userId: string; rows: number; sent: boolean; error?: string }[] = []
  for (const [userId, rows] of rowsByUser) {
    const to = await userEmail(userId)
    if (!to) {
      results.push({ userId, rows: rows.length, sent: false, error: 'Sin correo de perfil' })
      continue
    }
    try {
      await sendRecurringDigestEmail({ to, dateLabel: formatDayLong(today), rows, listUrl: appUrl(LIST_PATH) })
      results.push({ userId, rows: rows.length, sent: true })
    } catch (error) {
      results.push({ userId, rows: rows.length, sent: false, error: error instanceof Error ? error.message : String(error) })
    }
  }
  return results
}

/**
 * The daily cron: this month's recurring invoices that are due, the note to each user, the
 * automatic payment reminders and the notices of CSDs about to expire. `today` is a Mexico City day.
 */
export async function runDailyJobs(today: string) {
  const runs = await runDueRecurringInvoices(today)
  const digests = await sendDigests(runs, today)
  const reminders = await sendAutomaticReminders(today)
  const csdReminders = await sendCsdExpiryReminders(today)
  return {
    today,
    recurring: runs.map((run) => ({
      recurringId: run.recurringId,
      outcome: run.outcome.kind,
      invoiceId: run.invoice?.id ?? null,
      ...('error' in run.outcome ? { error: run.outcome.error } : {}),
    })),
    digests,
    reminders,
    csdReminders,
  }
}
