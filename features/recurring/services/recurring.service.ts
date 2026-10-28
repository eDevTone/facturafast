import { and, asc, count, desc, eq, inArray, lte } from 'drizzle-orm'
import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import { invoices } from '@database/schemas/invoices.schema'
import {
  recurringInvoices,
  type RecurringInvoice,
  type RecurringInvoiceTemplate,
} from '@database/schemas/recurring-invoices.schema'
import {
  copyInvoiceInput,
  createInvoice,
  getInvoiceById,
  prepareInvoiceInput,
  stampInvoice,
} from '@features/invoicing/services/invoice.service'
import type { CreateInvoiceInput, InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import { computeCfdiAmounts } from '@features/invoicing/utils/cfdi-amounts'
import { formatCfdiDate } from '@features/stamping/utils/cfdi-xml'
import { fillPeriod, hasPeriodTokens, PERIOD_OFFSETS, periodFor, tokenizeDescriptions } from '../utils/period'
import { daysBetween } from '@shared/utils/day'
import { DAY_OPTIONS, monthOf, nextRunOn } from '../utils/schedule'

export type RecurringMode = 'draft' | 'stamp'

/** What the user picks in "Repetir cada mes". */
export interface RecurringSettings {
  dayOfMonth: number
  mode: RecurringMode
  /** Month the descriptions name: −1 the one before, 0 the same, 1 the one after. */
  periodOffset: number
}

/** A recurring invoice as the invoice detail mentions it. */
export interface RecurringSummary extends RecurringSettings {
  id: string
  nextRunOn: string
  active: boolean
}

/** A row of "Facturas de cada mes". */
export interface RecurringListItem extends RecurringSummary {
  clientName: string
  currency: string
  total: number
  /** The first concept of the next invoice, with its month filled in. */
  description: string
  hasPeriodTokens: boolean
  /** The template descriptions, with their tokens, for the settings dialog. */
  descriptions: string[]
  lastRunOn: string | null
  lastInvoice: { id: string; serie: string | null; folio: number } | null
}

/** What happened to one recurring invoice in a daily run. */
export type RecurringOutcome =
  | { kind: 'draft' | 'stamped'; invoiceId: string }
  | { kind: 'no_stamps' | 'stamp_failed'; invoiceId: string; error: string }
  | { kind: 'already' }
  | { kind: 'paused'; error: string }
  | { kind: 'error'; error: string }

export interface RecurringRun {
  recurringId: string
  userId: string
  issuingProfileId: string
  clientName: string
  outcome: RecurringOutcome
  /** The invoice it made, when it made one. */
  invoice: { id: string; serie: string | null; folio: number; total: string; currency: string } | null
}

function assertSettings(settings: RecurringSettings) {
  if (!DAY_OPTIONS.includes(settings.dayOfMonth)) throw new Error('Elige un día del 1 al 28 o el último día del mes.')
  if (settings.mode !== 'draft' && settings.mode !== 'stamp') throw new Error('Elige qué hacer cada mes.')
  if (!(PERIOD_OFFSETS as readonly number[]).includes(settings.periodOffset)) throw new Error('Elige qué mes dice la descripción.')
}

/** The template a recurring invoice keeps: the invoice's input, with the month in its descriptions as tokens. */
export function templateFromInvoice(invoice: InvoiceWithRelations, today: string) {
  const input = copyInvoiceInput(invoice)
  // A draft stands for this month's invoice; a stamped one, for the month it was stamped in.
  const issueDay = invoice.status === 'draft' ? today : formatCfdiDate(invoice.issuedAt).slice(0, 10)
  const { descriptions, periodOffset, detected } = tokenizeDescriptions(input.items.map((item) => item.description), monthOf(issueDay))
  const template: RecurringInvoiceTemplate = {
    ...input,
    // Each month takes the DOF rate of its own stamping day.
    exchangeRateSource: input.currency && input.currency !== 'MXN' ? 'dof' : null,
    items: input.items.map((item, index) => ({ ...item, description: descriptions[index] })),
  }
  return { template, issueDay, periodOffset, detected }
}

/** Total of a template, as its invoices will be stamped. */
function templateTotal(template: RecurringInvoiceTemplate): number {
  return computeCfdiAmounts(template.items, {
    pricesIncludeIva: template.pricesIncludeIva,
    ivaRate: template.ivaRate,
    isrWithholdingRate: template.isrWithholdingRate,
    ivaWithholdingRate: template.ivaWithholdingRate,
  }).total
}

async function getOwnRecurring(id: string, userId: string): Promise<RecurringInvoice> {
  const [recurring] = await db
    .select()
    .from(recurringInvoices)
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
    .limit(1)
  if (!recurring) throw new Error('No encontramos esa factura de cada mes.')
  return recurring
}

function toSummary(recurring: RecurringInvoice): RecurringSummary {
  return {
    id: recurring.id,
    dayOfMonth: recurring.dayOfMonth,
    mode: recurring.mode,
    periodOffset: recurring.periodOffset,
    nextRunOn: recurring.nextRunOn,
    active: recurring.active,
  }
}

/**
 * "Repetir cada mes" on an invoice. The invoice becomes the first of the series: it covers its own
 * month, so the first one the app makes is in the next month that has none.
 */
export async function createRecurringInvoice(invoiceId: string, userId: string, settings: RecurringSettings, today: string) {
  assertSettings(settings)
  const invoice = await getInvoiceById(invoiceId, userId)
  if (!invoice) throw new Error('Factura no encontrada')
  if (invoice.status === 'cancelada') throw new Error('Una factura cancelada no se puede repetir.')
  if (invoice.recurringInvoiceId) throw new Error('Esta factura ya se repite cada mes.')
  if (!invoice.issuingProfileId) throw new Error('La factura no tiene perfil fiscal.')

  const { template, issueDay } = templateFromInvoice(invoice, today)
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(recurringInvoices)
      .values({
        userId,
        issuingProfileId: invoice.issuingProfileId!,
        clientId: invoice.clientId,
        sourceInvoiceId: invoice.id,
        template,
        dayOfMonth: settings.dayOfMonth,
        mode: settings.mode,
        periodOffset: settings.periodOffset,
        lastRunOn: issueDay,
        nextRunOn: nextRunOn(settings.dayOfMonth, today, issueDay),
      })
      .returning()
    await tx
      .update(invoices)
      .set({ recurringInvoiceId: created.id, recurringPeriod: monthOf(issueDay) })
      .where(and(eq(invoices.id, invoice.id), eq(invoices.userId, userId)))
    return toSummary(created)
  })
}

/** The recurring invoice an invoice belongs to, for its detail. */
export async function getRecurringOfInvoice(invoice: Pick<InvoiceWithRelations, 'recurringInvoiceId'>, userId: string) {
  if (!invoice.recurringInvoiceId) return null
  const [recurring] = await db
    .select()
    .from(recurringInvoices)
    .where(and(eq(recurringInvoices.id, invoice.recurringInvoiceId), eq(recurringInvoices.userId, userId)))
    .limit(1)
  return recurring ? toSummary(recurring) : null
}

/** "Facturas de cada mes": active ones first, then by their next date. */
export async function getRecurringInvoices(userId: string): Promise<RecurringListItem[]> {
  const rows = await db
    .select({ recurring: recurringInvoices, clientName: clients.businessName })
    .from(recurringInvoices)
    .innerJoin(clients, eq(clients.id, recurringInvoices.clientId))
    .where(eq(recurringInvoices.userId, userId))
    .orderBy(desc(recurringInvoices.active), asc(recurringInvoices.nextRunOn))
  if (rows.length === 0) return []

  const made = await db
    .select({ id: invoices.id, serie: invoices.serie, folio: invoices.folio, recurringInvoiceId: invoices.recurringInvoiceId })
    .from(invoices)
    .where(and(eq(invoices.userId, userId), inArray(invoices.recurringInvoiceId, rows.map((row) => row.recurring.id))))
    .orderBy(desc(invoices.createdAt))
  const lastInvoice = new Map<string, RecurringListItem['lastInvoice']>()
  for (const invoice of made) {
    if (invoice.recurringInvoiceId && !lastInvoice.has(invoice.recurringInvoiceId)) {
      lastInvoice.set(invoice.recurringInvoiceId, { id: invoice.id, serie: invoice.serie, folio: invoice.folio })
    }
  }

  return rows.map(({ recurring, clientName }) => {
    const first = recurring.template.items[0]?.description ?? ''
    return {
      ...toSummary(recurring),
      clientName,
      currency: recurring.template.currency ?? 'MXN',
      total: templateTotal(recurring.template),
      description: fillPeriod(first, periodFor(monthOf(recurring.nextRunOn), recurring.periodOffset)),
      hasPeriodTokens: recurring.template.items.some((item) => hasPeriodTokens(item.description)),
      descriptions: recurring.template.items.map((item) => item.description),
      lastRunOn: recurring.lastRunOn,
      lastInvoice: lastInvoice.get(recurring.id) ?? null,
    }
  })
}

/** How many a user has, for the link in Facturas. */
export async function countRecurringInvoices(userId: string): Promise<number> {
  const [row] = await db.select({ n: count() }).from(recurringInvoices).where(eq(recurringInvoices.userId, userId))
  return row?.n ?? 0
}

/** The template, for "Cambiar conceptos". */
export async function getRecurringTemplate(id: string, userId: string) {
  const recurring = await getOwnRecurring(id, userId)
  return { ...toSummary(recurring), template: recurring.template }
}

/** Day, mode and month of the descriptions. A new day moves the next date; a month with its invoice is not repeated. */
export async function updateRecurringSettings(id: string, userId: string, settings: RecurringSettings, today: string) {
  assertSettings(settings)
  const current = await getOwnRecurring(id, userId)
  const [updated] = await db
    .update(recurringInvoices)
    .set({
      dayOfMonth: settings.dayOfMonth,
      mode: settings.mode,
      periodOffset: settings.periodOffset,
      nextRunOn: nextRunOn(settings.dayOfMonth, today, current.lastRunOn),
      updatedAt: new Date(),
    })
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
    .returning()
  return toSummary(updated)
}

/** Pause or resume. Resuming does not make the months it missed: it goes on from the next date. */
export async function setRecurringActive(id: string, userId: string, active: boolean, today: string) {
  const current = await getOwnRecurring(id, userId)
  const [updated] = await db
    .update(recurringInvoices)
    .set({
      active,
      ...(active ? { nextRunOn: nextRunOn(current.dayOfMonth, today, current.lastRunOn) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
    .returning()
  return toSummary(updated)
}

/** "Cambiar conceptos": a new template, checked like an invoice (client and profile of the user). */
export async function updateRecurringTemplate(id: string, userId: string, input: CreateInvoiceInput) {
  await getOwnRecurring(id, userId)
  const data = await prepareInvoiceInput(userId, input)
  if (!data.issuingProfileId) throw new Error('Elige el perfil fiscal.')
  const template: RecurringInvoiceTemplate = {
    ...data,
    exchangeRateSource: data.currency && data.currency !== 'MXN' ? 'dof' : null,
  }
  await db
    .update(recurringInvoices)
    .set({ template, clientId: data.clientId, issuingProfileId: data.issuingProfileId, updatedAt: new Date() })
    .where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
}

/** Deleting it leaves the invoices it made as they are. */
export async function deleteRecurringInvoice(id: string, userId: string) {
  await getOwnRecurring(id, userId)
  await db.delete(recurringInvoices).where(and(eq(recurringInvoices.id, id), eq(recurringInvoices.userId, userId)))
}

// ── Daily run ────────────────────────────────────────────────────────────────

/** Postgres unique violation, as postgres-js reports it (Drizzle may wrap it in `cause`). */
function isUniqueViolation(error: unknown): boolean {
  const code = (value: unknown) => (value as { code?: string } | null)?.code
  return code(error) === '23505' || code((error as { cause?: unknown } | null)?.cause) === '23505'
}

/** A run up to this many days late (the cron missed a day) still makes the month it was due for. */
const LATE_TOLERANCE_DAYS = 7

/**
 * The month a run makes, and the day noted as covering it. A few days late, it is the month the
 * run was due for; later than that, the months missed are skipped and today's month is made.
 */
function coveredBy(recurring: RecurringInvoice, today: string): { runMonth: string; coveredOn: string } {
  const onTime = daysBetween(recurring.nextRunOn, today) <= LATE_TOLERANCE_DAYS
  const coveredOn = onTime ? recurring.nextRunOn : today
  return { runMonth: monthOf(coveredOn), coveredOn }
}

/** Notes the month as made and moves to the next one. */
async function advance(recurring: RecurringInvoice, coveredOn: string, today: string) {
  await db
    .update(recurringInvoices)
    .set({ lastRunOn: coveredOn, nextRunOn: nextRunOn(recurring.dayOfMonth, today, coveredOn), updatedAt: new Date() })
    .where(eq(recurringInvoices.id, recurring.id))
}

/**
 * One recurring invoice's run: the month's invoice from the template, as a draft or stamped (which
 * also emails it to the client). Running twice on the same month makes nothing new: the unique
 * index on (recurring_invoice_id, recurring_period) refuses the second one.
 */
async function runRecurringInvoice(recurring: RecurringInvoice, clientName: string, today: string): Promise<RecurringRun> {
  const run = { recurringId: recurring.id, userId: recurring.userId, issuingProfileId: recurring.issuingProfileId, clientName }
  const { runMonth, coveredOn } = coveredBy(recurring, today)
  const period = periodFor(runMonth, recurring.periodOffset)
  const input: CreateInvoiceInput = {
    ...recurring.template,
    items: recurring.template.items.map((item) => ({ ...item, description: fillPeriod(item.description, period) })),
  }

  let invoice: Awaited<ReturnType<typeof createInvoice>>
  try {
    invoice = await createInvoice(recurring.userId, input, {
      recurring: { recurringInvoiceId: recurring.id, recurringPeriod: runMonth },
    })
  } catch (error) {
    if (isUniqueViolation(error)) {
      await advance(recurring, coveredOn, today)
      return { ...run, outcome: { kind: 'already' }, invoice: null }
    }
    const message = error instanceof Error ? error.message : String(error)
    // The client or the profile is gone: the series cannot go on until the user fixes it.
    if (/no encontrado/i.test(message)) {
      await db.update(recurringInvoices).set({ active: false, updatedAt: new Date() }).where(eq(recurringInvoices.id, recurring.id))
      return { ...run, outcome: { kind: 'paused', error: message }, invoice: null }
    }
    // Anything else is tried again tomorrow.
    return { ...run, outcome: { kind: 'error', error: message }, invoice: null }
  }

  await advance(recurring, coveredOn, today)
  const made = { id: invoice.id, serie: invoice.serie, folio: invoice.folio, total: invoice.total, currency: invoice.currency }
  if (recurring.mode === 'draft') return { ...run, outcome: { kind: 'draft', invoiceId: invoice.id }, invoice: made }

  try {
    const result = await stampInvoice(invoice.id, recurring.userId)
    if (result.success) return { ...run, outcome: { kind: 'stamped', invoiceId: invoice.id }, invoice: made }
    const kind = result.code === 'NO_STAMPS' ? 'no_stamps' : 'stamp_failed'
    return { ...run, outcome: { kind, invoiceId: invoice.id, error: result.error ?? '' }, invoice: made }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { ...run, outcome: { kind: 'stamp_failed', invoiceId: invoice.id, error: message }, invoice: made }
  }
}

/** Every active recurring invoice due by `today` (Mexico City), oldest date first. */
export async function runDueRecurringInvoices(today: string): Promise<RecurringRun[]> {
  const due = await db
    .select({ recurring: recurringInvoices, clientName: clients.businessName })
    .from(recurringInvoices)
    .innerJoin(clients, eq(clients.id, recurringInvoices.clientId))
    .where(and(eq(recurringInvoices.active, true), lte(recurringInvoices.nextRunOn, today)))
    .orderBy(asc(recurringInvoices.nextRunOn))

  const runs: RecurringRun[] = []
  for (const { recurring, clientName } of due) {
    runs.push(await runRecurringInvoice(recurring, clientName, today))
  }
  return runs
}
