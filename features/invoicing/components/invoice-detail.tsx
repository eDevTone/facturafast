'use client'

import { useTransition } from 'react'
import { Button } from '@shared/ui/button'
import { Pencil, Send, Download, Copy } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'
import { DeleteInvoiceDialog } from './delete-invoice-dialog'
import { CancelInvoiceDialog } from './cancel-invoice-dialog'
import { InvoicePreviewDialog } from './invoice-preview-dialog'
import { stampInvoiceAction } from '../actions/stamp-invoice.action'
import { getInvoiceDownloadUrlAction } from '../actions/get-download-url.action'
import { StatusBadge } from './status-badge'
import { InvoiceHelpDialog } from './invoice-help-dialog'

interface FiscalProfileData {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
  logoUrl?: string | null
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
  const [isStamping, startStamping] = useTransition()
  const invoiceLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada'
  const isCancelled = invoice.status === 'cancelada'

  const handleStamp = () => {
    startStamping(async () => {
      const result = await stampInvoiceAction(invoice.id)
      if (result.success) {
        toast.success('Factura timbrada correctamente', {
          description: `UUID: ${result.uuid}`,
        })
      } else {
        toast.error('Error al timbrar', {
          description: result.error,
        })
      }
    })
  }

  const handleDownload = async (type: 'xml' | 'pdf' | 'acuse') => {
    const key = type === 'xml'
      ? invoice.xmlUrl
      : type === 'pdf'
        ? invoice.pdfUrl
        : invoice.cancellationAcuseUrl

    // If R2 key exists, get a signed URL
    if (key) {
      const result = await getInvoiceDownloadUrlAction(key)
      if (result.url) {
        if (type === 'pdf') {
          window.open(result.url, '_blank')
        } else {
          const res = await fetch(result.url)
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = type === 'acuse'
            ? `acuse-cancelacion-${invoiceLabel}.xml`
            : `factura-${invoiceLabel}.xml`
          a.click()
          URL.revokeObjectURL(url)
        }
        return
      }
    }

    // Fallback: generate from xmlContent in memory
    if (type === 'xml' && invoice.xmlContent) {
      const blob = new Blob([invoice.xmlContent], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${invoiceLabel}.xml`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-mono">
              {invoiceLabel}
            </h1>
            <StatusBadge status={invoice.status} size="md" />
            <InvoiceHelpDialog status={invoice.status} />
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            Creada el{' '}
            {new Date(invoice.createdAt).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {isStamped && invoice.uuid && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(invoice.uuid!)
                toast.success('UUID copiado')
              }}
              className="flex items-center gap-1.5 mt-1 text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              {invoice.uuid}
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <DeleteInvoiceDialog
              invoiceId={invoice.id}
              invoiceLabel={invoiceLabel}
            />
          )}
          {(isStamped || isCancelled) && (invoice.xmlUrl || invoice.xmlContent) && (
            <Button variant="outline" onClick={() => handleDownload('xml')}>
              <Download className="h-4 w-4 mr-2" />
              XML
            </Button>
          )}
          {(isStamped || isCancelled) && invoice.pdfUrl && (
            <Button variant="outline" onClick={() => handleDownload('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          )}
          {isCancelled && invoice.cancellationAcuseUrl && (
            <Button variant="outline" onClick={() => handleDownload('acuse')}>
              <Download className="h-4 w-4 mr-2" />
              Acuse
            </Button>
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
              <Button onClick={handleStamp} disabled={isStamping}>
                <Send className="h-4 w-4 mr-2" />
                {isStamping ? 'Timbrando...' : 'Timbrar'}
              </Button>
            </>
          )}
          {isStamped && (
            <CancelInvoiceDialog
              invoiceId={invoice.id}
              invoiceLabel={invoiceLabel}
            />
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

