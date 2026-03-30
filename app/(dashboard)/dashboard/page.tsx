import { auth } from '@clerk/nextjs/server'
import { getDashboardStats, getRecentInvoices } from '@features/dashboard/services/dashboard.service'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import {
  ArrowUpRight,
  CircleDot,
  FileText,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PlanUsageBanner } from '@features/billing/components/plan-usage-banner'
import { getOrCreateSubscription } from '@features/billing/services/subscription.service'
import { StatusBadge } from '@features/invoicing/components/status-badge'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [stats, recentInvoices, subscription] = await Promise.all([
    getDashboardStats(userId),
    getRecentInvoices(userId, 7),
    getOrCreateSubscription(userId),
  ])

  const growthPercent =
    stats.totalBilledLastMonth > 0
      ? ((stats.totalBilledThisMonth - stats.totalBilledLastMonth) / stats.totalBilledLastMonth) * 100
      : stats.totalBilledThisMonth > 0
        ? 100
        : 0

  const invoiceGrowth =
    stats.invoiceCountLastMonth > 0
      ? stats.invoiceCountThisMonth - stats.invoiceCountLastMonth
      : stats.invoiceCountThisMonth

  const totalInvoices = stats.draftCount + stats.timbradaCount + stats.canceladaCount
  const hasData = totalInvoices > 0 || stats.totalClients > 0

  const { plan: currentPlan, stampsUsed, stampsLimit } = subscription

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Resumen de tu actividad de facturación
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nueva Factura
        </Link>
      </div>

      {/* Plan usage */}
      <PlanUsageBanner plan={currentPlan} stampsUsed={stampsUsed} stampsLimit={stampsLimit} />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total facturado */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Facturado este mes
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight font-mono">
            {formatCurrency(stats.totalBilledThisMonth)}
          </p>
          {stats.totalBilledLastMonth > 0 ? (
            <p className={`mt-2 text-[13px] flex items-center gap-1 ${growthPercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {growthPercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(1)}% vs mes anterior
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-muted-foreground/60">
              Sin datos del mes anterior
            </p>
          )}
          {/* Breakdown: timbrado vs borradores */}
          {stats.totalBilledThisMonth > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Timbrado
                </span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(stats.timbradaAmountThisMonth)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  Por cobrar
                </span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(stats.draftAmountThisMonth)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Facturas este mes */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Facturas este mes
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {stats.invoiceCountThisMonth}
          </p>
          <p className={`mt-2 text-[13px] ${invoiceGrowth > 0 ? 'text-primary' : invoiceGrowth < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {invoiceGrowth > 0 ? `+${invoiceGrowth}` : invoiceGrowth} vs mes anterior
          </p>
        </div>

        {/* Clientes */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Clientes
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            {stats.totalClients}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Registrados
          </p>
        </div>

        {/* Totals by status */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Timbrado / Por Cobrar 
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Timbradas
                  <span className="text-[11px] text-muted-foreground/50">({stats.timbradaCount})</span>
                </span>
              </div>
              <p className="mt-0.5 text-sm font-mono font-medium text-primary pl-4">
                {formatCurrency(stats.totalTimbradaAmount)}
              </p>
            </div>
            <div className="h-px bg-border/40" />
            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  Borradores
                  <span className="text-[11px] text-muted-foreground/50">({stats.draftCount})</span>
                </span>
              </div>
              <p className="mt-0.5 text-sm font-mono font-medium pl-4">
                {formatCurrency(stats.totalDraftAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h2 className="text-sm font-semibold text-foreground">
            Facturas Recientes
          </h2>
          <Link
            href="/invoices"
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todas <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Sin facturas aún
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground/60">
              Crea tu primera factura para ver la actividad aquí
            </p>
            <Link
              href="/invoices/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-[1fr_120px_120px_100px] items-center gap-4 px-5 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Cliente
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Folio
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
                Total
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
                Estado
              </span>
            </div>

            {recentInvoices.map((inv) => {
              const folioLabel = `${inv.serie ? `${inv.serie}-` : ''}${inv.folio}`
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_100px] items-center gap-2 md:gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {inv.clientName}
                    </p>
                    <p className="text-[12px] text-muted-foreground md:hidden">
                      {folioLabel} · {formatCurrency(parseFloat(inv.total))}
                    </p>
                  </div>
                  <p className="hidden md:block text-[13px] font-mono text-muted-foreground">
                    {folioLabel}
                  </p>
                  <p className="hidden md:block text-sm font-mono font-medium text-foreground text-right">
                    {formatCurrency(parseFloat(inv.total))}
                  </p>
                  <div className="hidden md:flex justify-end">
                    <StatusBadge status={inv.status} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Onboarding hint when no data */}
      {!hasData && (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            Bienvenido a FacturaFast
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-md mx-auto">
            Comienza configurando tu perfil fiscal y creando tu primer cliente para empezar a facturar.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/fiscal-profiles"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              Configurar Perfil
            </Link>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
            >
              Agregar Cliente
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

