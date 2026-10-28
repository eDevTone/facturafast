'use client'

import { collectionState, type CollectionState } from '@features/collections/utils/collection-state'
import { TablePagination } from '@shared/components/table-pagination'
import { usePagination } from '@shared/hooks/use-pagination'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { refreshPendingCancellationsAction } from '../actions/refresh-pending-cancellations.action'
import { useCancellationRefresh } from '../hooks/use-cancellation-refresh'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { InvoiceRow } from './invoice-row'

interface InvoiceListProps {
  invoices: InvoiceWithRelations[]
  /** Amount collected with complementos de pago, per invoice id. */
  paidByInvoice?: Record<string, number>
  /** Today in Mexico City, YYYY-MM-DD: what is overdue is counted from it. */
  today: string
  /** "Te deben" in the Inicio links here with the list already filtered. */
  initialFilter?: StatusFilter
}

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'draft', label: 'Borradores' },
  { value: 'timbrada', label: 'Timbradas' },
  { value: 'por_cobrar', label: 'Por cobrar' },
  { value: 'vencidas', label: 'Vencidas' },
  { value: 'cancelada', label: 'Canceladas' },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

/** Whether an invoice goes under a filter: its CFDI status, or what is still owed on it. */
function matchesFilter(invoice: InvoiceWithRelations, state: CollectionState | null, filter: StatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'por_cobrar':
      return state !== null && state.status !== 'cobrada'
    case 'vencidas':
      return state?.status === 'vencida'
    default:
      return invoice.status === filter
  }
}

/** Asks the SAT about cancellations still in process; true when one was resolved. */
async function refreshPendingCancellations() {
  return (await refreshPendingCancellationsAction()).changed > 0
}

export function InvoiceList({ invoices, paidByInvoice = {}, today, initialFilter }: InvoiceListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>(initialFilter ?? 'all')
  const states = useMemo(
    () => new Map(invoices.map((inv) => [
      inv.id,
      collectionState(inv, { total: parseFloat(inv.total), paid: paidByInvoice[inv.id] ?? 0 }, today),
    ])),
    [invoices, paidByInvoice, today],
  )
  useCancellationRefresh(refreshPendingCancellations, invoices.some((invoice) => invoice.cancellationStatus === 'en_proceso'))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invoices.filter(
      inv =>
        matchesFilter(inv, states.get(inv.id) ?? null, status) &&
        (!q ||
          inv.client.businessName.toLowerCase().includes(q) ||
          inv.client.rfc.toLowerCase().includes(q) ||
          `${inv.serie || ''}${inv.folio}`.toLowerCase().includes(q))
    )
  }, [invoices, search, status, states])

  const pagination = usePagination(filtered, PAGE_SIZE)

  if (invoices.length === 0) {
    return (
      <div className="hoja-borrador px-6 py-14 text-center">
        <p className="font-mono text-sm text-tinta-roja">Nº 0001</p>
        <h3 className="mt-3 text-base font-semibold">Tu talonario está en blanco</h3>
        <p className="mx-auto mt-1 max-w-xs text-sm text-tinta-tenue">
          La primera factura toma un par de minutos. Elige a tu cliente, describe el servicio y timbra.
        </p>
        <Button asChild className="mt-5">
          <Link href="/invoices/new">Hacer mi primera factura</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search and status filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tinta-tenue" />
          <Input
            placeholder="Buscar por folio, cliente o RFC"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar facturas"
          />
        </div>
        <div className="flex flex-wrap gap-1 text-[13px]" role="radiogroup" aria-label="Filtrar por estatus">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              type="button"
              role="radio"
              aria-checked={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={cn(
                'rounded-[4px] px-2.5 py-1 transition-colors',
                status === filter.value ? 'bg-sello-tenue font-medium text-tinta' : 'text-tinta-tenue hover:text-tinta',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="hoja">
        <div className="divide-y divide-renglon">
          {/* Column headers */}
          <div className="hidden items-center gap-3 px-5 py-2.5 text-[13px] text-tinta-tenue lg:grid lg:grid-cols-[136px_1fr_80px_136px_120px_32px]">
            <span>Folio</span>
            <span>Cliente</span>
            <span>Fecha</span>
            <span>Estatus</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-tinta-tenue">
                {search
                  ? <>Ninguna factura coincide con &ldquo;{search}&rdquo;.</>
                  : status === 'por_cobrar'
                    ? 'Nadie te debe: todas tus facturas están cobradas.'
                    : status === 'vencidas'
                      ? 'No tienes facturas vencidas.'
                      : 'No hay facturas con este estatus.'}
              </p>
            </div>
          ) : (
            pagination.items.map(invoice => (
              <InvoiceRow
                key={invoice.id}
                invoice={invoice}
                paid={paidByInvoice[invoice.id] ?? 0}
                collection={states.get(invoice.id) ?? null}
              />
            ))
          )}
        </div>

        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={pagination.setPage}
        />
      </div>
    </div>
  )
}
