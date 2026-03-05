'use client'

import { FileText } from 'lucide-react'
import { Button } from '@shared/ui/button'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'

interface InvoiceListProps {
  invoices: InvoiceWithRelations[]
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No hay facturas aún
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea tu primera factura para comenzar
          </p>
          <div className="mt-5">
            <Button>Nueva Factura</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {invoices.map(invoice => (
        <div
          key={invoice.id}
          className="group flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-4 transition-colors hover:border-border"
        >
          {/* Left: Invoice info */}
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {invoice.serie && `${invoice.serie}-`}{invoice.folio}
                </p>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {invoice.client.businessName} · {new Date(invoice.issuedAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Right: Amount */}
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(parseFloat(invoice.total))}
            </p>
            <p className="text-xs text-muted-foreground">
              {invoice.items.length} concepto{invoice.items.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}
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
