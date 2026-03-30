'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, Search } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { InvoiceRow } from './invoice-row'

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
        <div className="hidden md:grid md:grid-cols-[100px_1fr_120px_100px_120px_44px] items-center gap-4 px-5 py-2.5">
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
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No se encontraron facturas para &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          filtered.map(invoice => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))
        )}
      </div>
    </div>
  )
}
