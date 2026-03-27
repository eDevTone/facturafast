'use client'

import { Button } from '@shared/ui/button'
import { Pencil, Send } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'
import { DeleteInvoiceDialog } from './delete-invoice-dialog'
import { InvoicePreviewDialog } from './invoice-preview-dialog'

interface FiscalProfileData {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
}

interface InvoiceDetailProps {
  invoice: InvoiceWithRelations
  emisor?: FiscalProfileData | null
  labels: {
    paymentForms: Record<string, string>
    paymentMethods: Record<string, string>
    cfdiUsages: Record<string, string>
  }
}

export function InvoiceDetail({ invoice, emisor, labels }: InvoiceDetailProps) {
  const invoiceLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'

  return (
    <div className="space-y-6">
      {/* Header — outside de la card */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-mono">
              {invoiceLabel}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            Creada el{' '}
            {new Date(invoice.createdAt).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <DeleteInvoiceDialog
              invoiceId={invoice.id}
              invoiceLabel={invoiceLabel}
            />
          )}
          <InvoicePreviewDialog invoice={invoice} emisor={emisor} labels={labels} />
          {isDraft && (
            <>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </Link>
              <Button
                onClick={() =>
                  toast.info('Próximamente', {
                    description: 'La integración con el PAC se implementará después.',
                  })
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Timbrar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content card */}
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-8">

      {/* Receptor */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Receptor
          </h2>
          <div className="mt-1 h-px bg-border/40" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Cliente</p>
            <p className="text-sm font-medium text-foreground">{invoice.client.businessName}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">RFC</p>
            <p className="text-sm font-mono tracking-wide text-foreground">{invoice.client.rfc}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Uso CFDI</p>
            <p className="text-sm text-foreground">
              {invoice.cfdiUsage} — {labels.cfdiUsages[invoice.cfdiUsage] || invoice.cfdiUsage}
            </p>
          </div>
        </div>
      </section>

      {/* Datos de Pago */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Datos de Pago
          </h2>
          <div className="mt-1 h-px bg-border/40" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Forma de Pago</p>
            <p className="text-sm text-foreground">
              {invoice.paymentForm} — {labels.paymentForms[invoice.paymentForm] || invoice.paymentForm}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Método de Pago</p>
            <p className="text-sm text-foreground">
              {invoice.paymentMethod} — {labels.paymentMethods[invoice.paymentMethod] || invoice.paymentMethod}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Moneda</p>
            <p className="text-sm text-foreground">{invoice.currency}</p>
          </div>
        </div>
      </section>

      {/* Conceptos */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Conceptos
          </h2>
          <div className="mt-1 h-px bg-border/40" />
        </div>

        <div className="rounded-lg border border-border/40 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_120px_120px] gap-4 px-5 py-2.5 border-b border-border/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Descripción
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
              Cant.
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
              P. Unitario
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
              Importe
            </span>
          </div>

          {/* Items */}
          {invoice.items.map(item => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_80px_120px_120px] gap-4 px-5 py-3 border-b border-border/20 last:border-b-0"
            >
              <div>
                <p className="text-sm text-foreground">{item.description}</p>
                <p className="text-[11px] text-muted-foreground/50 font-mono mt-0.5">
                  {item.productServiceCode} · {item.unit}
                </p>
              </div>
              <p className="text-sm font-mono text-foreground text-right">
                {parseFloat(item.quantity).toLocaleString('es-MX')}
              </p>
              <p className="text-sm font-mono text-foreground text-right">
                {formatCurrency(parseFloat(item.unitPrice))}
              </p>
              <p className="text-sm font-mono font-medium text-foreground text-right">
                {formatCurrency(parseFloat(item.amount))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Totales */}
      <section>
        <div className="ml-auto max-w-xs space-y-1.5 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono font-medium">{formatCurrency(parseFloat(invoice.subtotal))}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">IVA 16%</span>
            <span className="font-mono font-medium">{formatCurrency(parseFloat(invoice.iva))}</span>
          </div>
          {parseFloat(invoice.withholdings) > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Retenciones</span>
              <span className="font-mono font-medium text-destructive">
                -{formatCurrency(parseFloat(invoice.withholdings))}
              </span>
            </div>
          )}
          <div className="h-px bg-border/40 my-1" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-lg font-mono font-bold text-primary">
              {formatCurrency(parseFloat(invoice.total))}
            </span>
          </div>
        </div>
      </section>

      </div>{/* end content card */}
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
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-medium ${className}`}>
      {label}
    </span>
  )
}
