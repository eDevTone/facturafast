import { eq, and, sql, gte, lt, isNull, ne } from 'drizzle-orm'
import { db } from '@database/client'
import { invoices } from '@database/schemas/invoices.schema'
import { clients } from '@database/schemas/clients.schema'

export interface DashboardStats {
  totalBilledThisMonth: number
  totalBilledLastMonth: number
  timbradaAmountThisMonth: number
  draftAmountThisMonth: number
  invoiceCountThisMonth: number
  invoiceCountLastMonth: number
  totalClients: number
  draftCount: number
  timbradaCount: number
  canceladaCount: number
  totalDraftAmount: number
  totalTimbradaAmount: number
}

export interface RecentInvoice {
  id: string
  folio: number
  serie: string | null
  total: string
  status: string
  createdAt: Date
  clientName: string
}

function getMonthRange(offset = 0) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1)
  return { start, end }
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const thisMonth = getMonthRange(0)
  const lastMonth = getMonthRange(-1)

  const [
    billedThisMonth,
    billedLastMonth,
    timbradaThisMonth,
    draftThisMonth,
    countThisMonth,
    countLastMonth,
    clientCount,
    statusCounts,
  ] = await Promise.all([
    // Total billed this month (non-cancelled)
    db
      .select({ total: sql<string>`coalesce(sum(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          ne(invoices.status, 'cancelada'),
          gte(invoices.createdAt, thisMonth.start),
          lt(invoices.createdAt, thisMonth.end),
        ),
      ),

    // Total billed last month
    db
      .select({ total: sql<string>`coalesce(sum(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          ne(invoices.status, 'cancelada'),
          gte(invoices.createdAt, lastMonth.start),
          lt(invoices.createdAt, lastMonth.end),
        ),
      ),

    // Timbrada amount this month
    db
      .select({ total: sql<string>`coalesce(sum(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, 'timbrada'),
          gte(invoices.createdAt, thisMonth.start),
          lt(invoices.createdAt, thisMonth.end),
        ),
      ),

    // Draft amount this month
    db
      .select({ total: sql<string>`coalesce(sum(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, 'draft'),
          gte(invoices.createdAt, thisMonth.start),
          lt(invoices.createdAt, thisMonth.end),
        ),
      ),

    // Invoice count this month
    db
      .select({ count: sql<string>`count(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          gte(invoices.createdAt, thisMonth.start),
          lt(invoices.createdAt, thisMonth.end),
        ),
      ),

    // Invoice count last month
    db
      .select({ count: sql<string>`count(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          gte(invoices.createdAt, lastMonth.start),
          lt(invoices.createdAt, lastMonth.end),
        ),
      ),

    // Total clients
    db
      .select({ count: sql<string>`count(*)` })
      .from(clients)
      .where(and(eq(clients.userId, userId), isNull(clients.deletedAt))),

    // Status breakdown with amounts
    db
      .select({
        status: invoices.status,
        count: sql<string>`count(*)`,
        total: sql<string>`coalesce(sum(${invoices.total}), 0)`,
      })
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .groupBy(invoices.status),
  ])

  const statusMap: Record<string, { count: number; total: number }> = {}
  for (const row of statusCounts) {
    statusMap[row.status] = {
      count: parseInt(row.count, 10),
      total: parseFloat(row.total),
    }
  }

  return {
    totalBilledThisMonth: parseFloat(billedThisMonth[0].total),
    totalBilledLastMonth: parseFloat(billedLastMonth[0].total),
    timbradaAmountThisMonth: parseFloat(timbradaThisMonth[0].total),
    draftAmountThisMonth: parseFloat(draftThisMonth[0].total),
    invoiceCountThisMonth: parseInt(countThisMonth[0].count, 10),
    invoiceCountLastMonth: parseInt(countLastMonth[0].count, 10),
    totalClients: parseInt(clientCount[0].count, 10),
    draftCount: statusMap['draft']?.count ?? 0,
    timbradaCount: statusMap['timbrada']?.count ?? 0,
    canceladaCount: statusMap['cancelada']?.count ?? 0,
    totalDraftAmount: statusMap['draft']?.total ?? 0,
    totalTimbradaAmount: statusMap['timbrada']?.total ?? 0,
  }
}

export async function getRecentInvoices(userId: string, limit = 5): Promise<RecentInvoice[]> {
  const rows = await db.query.invoices.findMany({
    where: eq(invoices.userId, userId),
    orderBy: (invoices, { desc }) => desc(invoices.createdAt),
    limit,
    with: { client: true },
  })

  return rows.map((row) => ({
    id: row.id,
    folio: row.folio,
    serie: row.serie,
    total: row.total,
    status: row.status,
    createdAt: row.createdAt,
    clientName: row.client.businessName,
  }))
}
