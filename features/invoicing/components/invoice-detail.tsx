'use client'

import { Button } from '@shared/ui/button'
import { formatDateLong } from '@shared/utils/date'
import { Copy, Download, Pencil } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { getInvoiceDownloadUrlAction } from '../actions/get-download-url.action'
import { stampInvoiceAction } from '../actions/stamp-invoice.action'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'
import { numberToSpanishWords } from '../utils/number-to-words'
import { CancelInvoiceDialog } from './cancel-invoice-dialog'
import { DeleteInvoiceDialog } from './delete-invoice-dialog'
import { InvoiceHelpDialog } from './invoice-help-dialog'
import { InvoicePreviewDialog } from './invoice-preview-dialog'
import { MissingCsdBanner } from './missing-csd-banner'
import { StampConfirmDialog } from './stamp-confirm-dialog'
import { StatusBadge } from './status-badge'
import { TimbreFiscalSection } from './timbre-fiscal-section'

interface FiscalProfileData {
  id?: string
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
  logoUrl?: string | null
  certSerialNumber?: string | null
  hasCsd?: boolean
}

interface InvoiceDetailProps {
  invoice: InvoiceWithRelations
  emisor?: FiscalProfileData | null
  labels: {
    paymentForms: Record<string, string>
    paymentMethods: Record<string, string>
    cfdiUsages: Record<string, string>
    taxRegimes: Record<string, string>
  }
}

export function InvoiceDetail({ invoice, emisor, labels }: InvoiceDetailProps) {
  const router = useRouter()
  const [isStamping, startStamping] = useTransition()
  const invoiceLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada'
  const isCancelled = invoice.status === 'cancelada'
  const showCsdBanner = isDraft && emisor && emisor.id && !emisor.hasCsd

  const handleStamp = () => {
    startStamping(async () => {
      const result = await stampInvoiceAction(invoice.id)
      if (result.success) {
        const emailNote = invoice.client.email
          ? ` · Email enviado a ${invoice.client.email}`
          : ''
        toast.success('Factura timbrada correctamente', {
          description: `UUID: ${result.uuid}${emailNote}`,
        })
      } else {
        const isLimitError = result.error?.includes('Límite de timbres')
        toast.error('Error al timbrar', {
          description: result.error,
          action: isLimitError ? {
            label: 'Upgrade',
            onClick: () => router.push('/billing'),
          } : undefined,
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
      {/* Missing CSD banner */}
      {showCsdBanner && emisor?.id && (
        <MissingCsdBanner
          profileId={emisor.id}
          profileName={emisor.businessName}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-mono">
              {invoiceLabel}
            </h1>
            <StatusBadge status={invoice.status} size="md" />
            <InvoiceHelpDialog status={invoice.status} />
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            Emitida el {formatDateLong(invoice.issuedAt)}
          </p>
          {(isStamped || isCancelled) && invoice.stampedAt && (
            <p className="text-[12px] text-muted-foreground/60 mt-0.5">
              Timbrada el {formatDateLong(invoice.stampedAt)}
            </p>
          )}
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
        <div className="flex flex-wrap items-center gap-2">
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
              <StampConfirmDialog
                onConfirm={handleStamp}
                disabled={isStamping || !!showCsdBanner}
                isStamping={isStamping}
                clientEmail={invoice.client.email}
              />
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

      {/* Emisor */}
      {emisor && (
        <section className="space-y-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Emisor
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground/60 mb-0.5">Razón Social</p>
              <div className="flex items-center gap-2">
                {emisor.logoUrl && (
                  <Image
                    src={emisor.logoUrl}
                    alt={emisor.businessName}
                    width={32}
                    height={32}
                    className="rounded-md object-contain"
                  />
                )}
                <p className="text-sm font-medium text-foreground">{emisor.businessName}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground/60 mb-0.5">RFC</p>
              <p className="text-sm font-mono tracking-wide text-foreground">{emisor.rfc}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground/60 mb-0.5">Régimen Fiscal</p>
              <p className="text-sm text-foreground">
                {emisor.taxRegime} — {labels.taxRegimes[emisor.taxRegime] || emisor.taxRegime}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground/60 mb-0.5">Lugar de Expedición</p>
              <p className="text-sm font-mono tracking-wide text-foreground">CP {emisor.postalCode}</p>
            </div>
            {emisor.certSerialNumber && (
              <div>
                <p className="text-[11px] text-muted-foreground/60 mb-0.5">No. Certificado Emisor</p>
                <p className="text-sm font-mono tracking-wide text-foreground">{emisor.certSerialNumber}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Receptor */}
      <section className="space-y-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Receptor
          </h2>
          <div className="mt-1 h-px bg-border/40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          {invoice.client.taxRegime && (
            <div>
              <p className="text-[11px] text-muted-foreground/60 mb-0.5">Régimen Fiscal</p>
              <p className="text-sm text-foreground">
                {invoice.client.taxRegime} — {labels.taxRegimes[invoice.client.taxRegime] || invoice.client.taxRegime}
              </p>
            </div>
          )}
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Domicilio Fiscal</p>
            <p className="text-sm font-mono tracking-wide text-foreground">CP {invoice.client.postalCode}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div>
            <p className="text-[11px] text-muted-foreground/60 mb-0.5">Tipo de Cambio</p>
            <p className="text-sm font-mono text-foreground">1</p>
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
          <p className="text-[11px] uppercase text-muted-foreground/60 mt-2 pt-2 border-t border-border/30">
            {numberToSpanishWords(parseFloat(invoice.total))}
          </p>
        </div>
      </section>

      {/* Timbre Fiscal Digital */}
      {(isStamped || isCancelled) && (invoice.cfdiSignature || invoice.satSignature || invoice.qrCode) && (
        <TimbreFiscalSection invoice={invoice} emisor={emisor} />
      )}

      </div>{/* end content card */}
    </div>
  )
}

