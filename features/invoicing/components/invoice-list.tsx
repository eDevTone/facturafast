'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'

interface InvoiceListProps {
  invoices: InvoiceWithRelations[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices
    const q = search.toLowerCase()
    return invoices.filter(
      inv =>
        inv.client.businessName.toLowerCase().includes(q) ||
        inv.client.rfc.toLowerCase().includes(q) ||
        `${inv.serie || ''}${inv.folio}`.toLowerCase().includes(q)
    )
  }, [invoices, search])

  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No hay facturas aun
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Crea tu primera factura para comenzar a facturar
          </p>
          <Link href="/invoices/new" className="mt-5">
            <Button>Nueva Factura</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Buscar por folio, cliente o RFC..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/40">
        {/* Column headers */}
        <div className="hidden md:grid md:grid-cols-[100px_1fr_120px_100px_120px] items-center gap-4 px-5 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Folio
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Cliente
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Fecha
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Estatus
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
            Total
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No se encontraron facturas para &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          filtered.map(invoice => {
            const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`

            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="group grid grid-cols-1 md:grid-cols-[100px_1fr_120px_100px_120px] items-center gap-2 md:gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                {/* Folio */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-medium tracking-wide text-foreground">
                    {folioLabel}
                  </p>
                  {/* Mobile-only status */}
                  <span className="md:hidden">
                    <StatusBadge status={invoice.status} />
                  </span>
                </div>

                {/* Client */}
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {invoice.client.businessName}
                  </p>
                  <p className="text-[12px] font-mono text-muted-foreground/50 truncate md:hidden">
                    {invoice.client.rfc}
                  </p>
                </div>

                {/* Date */}
                <p className="text-[13px] text-muted-foreground">
                  {new Date(invoice.issuedAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                  })}
                </p>

                {/* Status — desktop */}
                <div className="hidden md:block">
                  <StatusBadge status={invoice.status} />
                </div>

                {/* Total */}
                <p className="text-sm font-mono font-semibold text-foreground text-right">
                  {formatCurrency(parseFloat(invoice.total))}
                </p>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: {
      label: 'Borrador',
      className: 'bg-muted text-muted-foreground',
    },
    timbrada: {
      label: 'Timbrada',
      className: 'bg-primary/15 text-primary',
    },
    cancelada: {
      label: 'Cancelada',
      className: 'bg-destructive/15 text-destructive',
    },
  }

  const { label, className } = config[status as keyof typeof config] ?? config.draft

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  )
}
