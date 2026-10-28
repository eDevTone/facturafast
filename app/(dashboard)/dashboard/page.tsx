import { auth } from '@clerk/nextjs/server'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { cn } from '@/lib/utils'
import { StampsBanner } from '@features/billing/components/plan-usage-banner'
import { getOrCreateAccount } from '@features/billing/services/account.service'
import { OwedSection } from '@features/collections/components/owed-section'
import { getOwedSummary } from '@features/collections/services/collection.service'
import { getDashboardOverview, getRecentInvoices } from '@features/dashboard/services/dashboard.service'
import { CsdExpiryNotice } from '@features/fiscal-profile/components/csd-expiry-notice'
import { getAllIssuingProfiles } from '@features/fiscal-profile/services/fiscal-profile.service'
import { Folio } from '@features/invoicing/components/folio'
import { StatusBadge } from '@features/invoicing/components/status-badge'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { Button } from '@shared/ui/button'
import { formatDateShort } from '@shared/utils/date'

export const dynamic = 'force-dynamic'

function monthTitle() {
  const label = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [overview, recentInvoices, account, owed, profiles] = await Promise.all([
    getDashboardOverview(userId),
    getRecentInvoices(userId, 6),
    getOrCreateAccount(userId),
    getOwedSummary(userId),
    getAllIssuingProfiles(userId),
  ])

  const { summary } = overview
  const steps = [
    { done: true, label: 'Tus datos fiscales', href: '/fiscal-profiles' },
    { done: overview.hasCsd, label: 'Sube tu CSD (.cer, .key y contraseña)', href: '/fiscal-profiles' },
    { done: overview.clientCount > 0, label: 'Agrega a tu primer cliente', href: '/clients/new' },
    { done: overview.hasStampedInvoice, label: 'Timbra tu primera factura', href: '/invoices/new' },
  ]
  const pendingSteps = steps.filter((step) => !step.done).length
  const change =
    summary.previousSubtotal > 0
      ? Math.round(((summary.subtotal - summary.previousSubtotal) / summary.previousSubtotal) * 100)
      : null

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[22px] font-semibold tracking-tight">Inicio</h1>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus />
            Nueva factura
          </Link>
        </Button>
      </div>

      {account.stampsBalance <= 1 && <StampsBanner stampsBalance={account.stampsBalance} />}
      <CsdExpiryNotice profiles={profiles} />

      {/* First steps: only until everything is done */}
      {pendingSteps > 0 && (
        <section className="hoja px-5 py-4 sm:px-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Primeros pasos</h2>
            <p className="text-[13px] text-tinta-tenue">
              {pendingSteps === 1 ? 'Te falta 1' : `Te faltan ${pendingSteps}`}
            </p>
          </div>
          <ol className="mt-3 divide-y divide-renglon border-t border-renglon">
            {steps.map((step) => (
              <li key={step.label} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border',
                    step.done ? 'border-sello bg-sello text-sello-tinta' : 'border-tinta-tenue/50',
                  )}
                >
                  {step.done && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                </span>
                {step.done ? (
                  <span className="text-sm text-tinta-tenue line-through decoration-renglon">{step.label}</span>
                ) : (
                  <Link href={step.href} className="text-sm text-tinta underline-offset-4 hover:text-sello hover:underline">
                    {step.label}
                  </Link>
                )}
                <span className="sr-only">{step.done ? 'Hecho' : 'Pendiente'}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* The month, as a summary sheet */}
      <section className="hoja overflow-hidden">
        <header className="guilloche flex flex-wrap items-baseline justify-between gap-2 border-b border-renglon px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold tracking-tight">{monthTitle()}</h2>
          <p className="text-[13px] text-tinta-tenue">
            <span className="font-mono text-tinta">{summary.stampedCount}</span>{' '}
            {summary.stampedCount === 1 ? 'factura timbrada' : 'facturas timbradas'}
            {overview.draftCount > 0 && (
              <>
                {' · '}
                <Link href="/invoices" className="underline-offset-4 hover:underline">
                  <span className="font-mono text-tinta">{overview.draftCount}</span>{' '}
                  {overview.draftCount === 1 ? 'borrador' : 'borradores'}
                </Link>
              </>
            )}
          </p>
        </header>

        <div className="grid gap-6 px-5 py-5 sm:grid-cols-[1.2fr_1fr] sm:px-6">
          <div>
            <p className="text-[13px] text-tinta-tenue">Facturado, sin IVA</p>
            <p className="mt-1 font-mono text-[32px] font-medium leading-none tracking-tight">
              {formatCurrency(summary.subtotal)}
            </p>
            <p className="mt-2 text-[13px] text-tinta-tenue">
              {change === null
                ? 'Sin facturas timbradas el mes pasado para comparar.'
                : `${change >= 0 ? '+' : '−'}${Math.abs(change)} % frente al mes pasado`}
            </p>
          </div>

          <dl className="space-y-1.5 text-sm">
            <SummaryRow label="IVA trasladado" value={summary.iva} />
            <SummaryRow label="ISR que te retuvieron" value={summary.isrWithheld} />
            <SummaryRow label="IVA que te retuvieron" value={summary.ivaWithheld} />
            <div className="flex items-center justify-between border-t border-tinta/70 pt-2">
              <dt className="font-medium">Neto facturado</dt>
              <dd className="font-mono">{formatCurrency(summary.net)}</dd>
            </div>
          </dl>
        </div>
        <p className="border-t border-renglon px-5 py-3 text-[12px] text-tinta-tenue sm:px-6">
          Montos de tus facturas timbradas este mes. Tu declaración se calcula con lo que efectivamente cobraste.
        </p>
      </section>

      {/* Who owes what, once there is something stamped */}
      {overview.hasStampedInvoice && <OwedSection summary={owed} today={todayInMexico()} />}

      {/* Recent invoices */}
      <section className="hoja">
        <div className="flex items-center justify-between px-5 py-3 sm:px-6">
          <h2 className="text-sm font-semibold">Últimas facturas</h2>
          {recentInvoices.length > 0 && (
            <Link href="/invoices" className="text-[13px] text-sello underline-offset-4 hover:underline">
              Ver todas
            </Link>
          )}
        </div>
        {recentInvoices.length === 0 ? (
          <div className="border-t border-renglon px-5 py-10 text-center sm:px-6">
            <p className="font-mono text-sm text-tinta-roja">Nº 0001</p>
            <p className="mt-2 text-sm text-tinta-tenue">Aquí aparecerán tus facturas.</p>
          </div>
        ) : (
          <ul className="divide-y divide-renglon border-t border-renglon">
            {recentInvoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-sello-tenue/40 lg:grid-cols-[136px_1fr_80px_136px_120px] lg:px-6"
                >
                  <Folio serie={invoice.serie} folio={invoice.folio} className="min-w-0 truncate text-sm" />
                  <span className="text-right font-mono text-sm lg:order-5">{formatCurrency(parseFloat(invoice.total), invoice.currency)}</span>
                  <span className="truncate text-sm lg:order-2">{invoice.clientName}</span>
                  <span className="text-right text-[13px] tabular-nums text-tinta-tenue lg:order-3 lg:text-left">
                    {formatDateShort(invoice.date)}
                  </span>
                  <span className="hidden lg:order-4 lg:block">
                    <StatusBadge invoice={invoice} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-tinta-tenue">{label}</dt>
      <dd className="font-mono">{formatCurrency(value)}</dd>
    </div>
  )
}
