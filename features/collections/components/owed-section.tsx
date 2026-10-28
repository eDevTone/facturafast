import { cn } from '@/lib/utils'
import { Folio } from '@features/invoicing/components/folio'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import Link from 'next/link'
import type { OwedSummary } from '../services/collection.service'
import { dueLabel } from '../utils/due-date'

/**
 * "Te deben", in the Inicio: everything owed in pesos, what is overdue, and the invoices to chase
 * first. Each one opens the invoice, where the reminder is.
 */
export function OwedSection({ summary, today }: { summary: OwedSummary; today: string }) {
  return (
    <section className="hoja" aria-labelledby="owed-title">
      <div className="flex items-center justify-between px-5 py-3 sm:px-6">
        <h2 id="owed-title" className="text-sm font-semibold">Te deben</h2>
        {summary.count > summary.invoices.length && (
          <Link href="/invoices?estado=por-cobrar" className="text-[13px] text-sello underline-offset-4 hover:underline">
            Ver todas
          </Link>
        )}
      </div>

      {summary.count === 0 ? (
        <p className="border-t border-renglon px-5 py-5 text-sm text-tinta-tenue sm:px-6">
          Nadie te debe. Cuando una factura quede por cobrar, aparecerá aquí con su vencimiento.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-renglon px-5 py-4 sm:px-6">
            <p className="font-mono text-2xl font-medium leading-none tracking-tight">{formatCurrency(summary.totalPesos)}</p>
            <p className="text-[13px] text-tinta-tenue">
              {summary.count === 1 ? 'en 1 factura' : `en ${summary.count} facturas`}
              {summary.overdueCount > 0 && (
                <>
                  {', '}
                  <Link href="/invoices?estado=vencidas" className="text-tinta-roja underline-offset-4 hover:underline">
                    <span className="font-mono">{formatCurrency(summary.overduePesos)}</span> vencidos
                  </Link>
                </>
              )}
            </p>
          </div>

          <ul className="divide-y divide-renglon border-t border-renglon">
            {summary.invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-5 py-3 transition-colors hover:bg-sello-tenue/40 lg:grid-cols-[136px_1fr_160px_120px] lg:px-6"
                >
                  <Folio serie={invoice.serie} folio={invoice.folio} className="min-w-0 truncate text-sm" />
                  <span className="text-right font-mono text-sm lg:order-4">
                    {formatCurrency(invoice.state.balance, invoice.currency)}
                  </span>
                  <span className="truncate text-sm lg:order-2">{invoice.clientName}</span>
                  <span
                    className={cn(
                      'text-right text-[13px] lg:order-3 lg:text-left',
                      invoice.state.status === 'vencida' ? 'text-tinta-roja' : 'text-tinta-tenue',
                    )}
                  >
                    {invoice.state.dueDate ? dueLabel(invoice.state.dueDate, today) : 'Sin vencimiento'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
