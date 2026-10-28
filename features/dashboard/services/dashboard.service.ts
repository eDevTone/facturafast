import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import { invoices } from '@database/schemas/invoices.schema'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'

const TZ = 'America/Mexico_City'

export interface MonthSummary {
  /** First day of the month, in Mexico City. */
  month: Date
  /** Sum of SubTotal (before IVA) of the invoices stamped this month and not cancelled. */
  subtotal: number
  iva: number
  isrWithheld: number
  ivaWithheld: number
  /** Sum of Total: what the clients pay after withholdings. */
  net: number
  stampedCount: number
  /** Same subtotal for the previous month, for comparison. */
  previousSubtotal: number
}

export interface DashboardOverview {
  summary: MonthSummary
  draftCount: number
  draftAmount: number
  clientCount: number
  hasCsd: boolean
  hasStampedInvoice: boolean
}

export interface RecentInvoice {
  id: string
  folio: number
  serie: string | null
  total: string
  currency: string
  status: 'draft' | 'timbrada' | 'cancelada'
  cancellationStatus: 'en_proceso' | 'rechazada' | null
  cancellationSubstituteUuid: string | null
  date: Date
  clientName: string
}

/**
 * Month totals are grouped by the stamping date in Mexico City, not by when the draft was created,
 * and drafts are counted apart: a draft is not income.
 */
export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  const stampedMonth = sql`date_trunc('month', ${invoices.stampedAt} AT TIME ZONE ${TZ})`
  const currentMonth = sql`date_trunc('month', now() AT TIME ZONE ${TZ})`
  // Invoices in dollars count in pesos, at the exchange rate stamped on each one.
  const toPesos = sql`coalesce(${invoices.exchangeRate}, 1)`

  const [monthRows, previousRows, draftRows, clientRows, profileRows, stampedRows] = await Promise.all([
    db
      .select({
        subtotal: sql<string>`coalesce(sum(round(${invoices.subtotal} * ${toPesos}, 2)), 0)`,
        iva: sql<string>`coalesce(sum(round(${invoices.iva} * ${toPesos}, 2)), 0)`,
        isr: sql<string>`coalesce(sum(round(round(${invoices.subtotal} * coalesce(${invoices.isrWithholdingRate}, 0), 2) * ${toPesos}, 2)), 0)`,
        withholdings: sql<string>`coalesce(sum(round(${invoices.withholdings} * ${toPesos}, 2)), 0)`,
        net: sql<string>`coalesce(sum(round(${invoices.total} * ${toPesos}, 2)), 0)`,
        count: sql<string>`count(*)`,
        month: sql<Date>`${currentMonth}`,
      })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, 'timbrada'), sql`${stampedMonth} = ${currentMonth}`)),
    db
      .select({ subtotal: sql<string>`coalesce(sum(round(${invoices.subtotal} * ${toPesos}, 2)), 0)` })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        eq(invoices.status, 'timbrada'),
        sql`${stampedMonth} = ${currentMonth} - interval '1 month'`,
      )),
    db
      .select({ count: sql<string>`count(*)`, total: sql<string>`coalesce(sum(round(${invoices.total} * ${toPesos}, 2)), 0)` })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, 'draft'))),
    db
      .select({ count: sql<string>`count(*)` })
      .from(clients)
      .where(and(eq(clients.userId, userId), isNull(clients.deletedAt))),
    db
      .select({ id: issuingProfiles.id })
      .from(issuingProfiles)
      .where(and(eq(issuingProfiles.userId, userId), sql`${issuingProfiles.cerBase64} IS NOT NULL`))
      .limit(1),
    db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), sql`${invoices.stampedAt} IS NOT NULL`))
      .limit(1),
  ])

  const month = monthRows[0]
  const withholdings = Number(month.withholdings)
  const isrWithheld = Number(month.isr)

  return {
    summary: {
      month: new Date(month.month),
      subtotal: Number(month.subtotal),
      iva: Number(month.iva),
      isrWithheld,
      ivaWithheld: Math.max(0, Math.round((withholdings - isrWithheld) * 100) / 100),
      net: Number(month.net),
      stampedCount: Number(month.count),
      previousSubtotal: Number(previousRows[0].subtotal),
    },
    draftCount: Number(draftRows[0].count),
    draftAmount: Number(draftRows[0].total),
    clientCount: Number(clientRows[0].count),
    hasCsd: profileRows.length > 0,
    hasStampedInvoice: stampedRows.length > 0,
  }
}

export async function getRecentInvoices(userId: string, limit = 5): Promise<RecentInvoice[]> {
  const rows = await db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: [desc(invoices.createdAt)],
    limit,
    with: { client: true },
  })

  return rows.map((row) => ({
    id: row.id,
    folio: row.folio,
    serie: row.serie,
    total: row.total,
    currency: row.currency,
    status: row.status,
    cancellationStatus: row.cancellationStatus,
    cancellationSubstituteUuid: row.cancellationSubstituteUuid,
    date: row.stampedAt ?? row.issuedAt,
    clientName: row.client.businessName,
  }))
}
