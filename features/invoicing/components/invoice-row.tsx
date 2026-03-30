'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Eye, Download, Copy, Ban, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { toast } from 'sonner'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'
import { getInvoiceDownloadUrlAction } from '../actions/get-download-url.action'
import { CancelInvoiceDialog } from './cancel-invoice-dialog'
import { DeleteInvoiceDialog } from './delete-invoice-dialog'
import { StatusBadge } from './status-badge'

export function InvoiceRow({ invoice }: { invoice: InvoiceWithRelations }) {
  const router = useRouter()
  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada'
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleDownload = async (type: 'xml' | 'pdf') => {
    const key = type === 'xml' ? invoice.xmlUrl : invoice.pdfUrl
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
          a.download = `factura-${folioLabel}.xml`
          a.click()
          URL.revokeObjectURL(url)
        }
        return
      }
    }
    if (type === 'xml' && invoice.xmlContent) {
      const blob = new Blob([invoice.xmlContent], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `factura-${folioLabel}.xml`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleCopyUuid = () => {
    if (!invoice.uuid) return
    navigator.clipboard.writeText(invoice.uuid)
    toast.success('UUID copiado')
  }

  return (
    <>
      <div className="group grid grid-cols-1 md:grid-cols-[100px_1fr_120px_100px_120px_44px] items-center gap-2 md:gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30">
        {/* Folio */}
        <Link href={`/invoices/${invoice.id}`} className="flex items-center gap-2">
          <p className="text-sm font-mono font-medium tracking-wide text-foreground group-hover:text-primary transition-colors">
            {folioLabel}
          </p>
          <span className="md:hidden">
            <StatusBadge status={invoice.status} />
          </span>
        </Link>

        {/* Client */}
        <Link href={`/invoices/${invoice.id}`} className="min-w-0">
          <p className="text-sm text-foreground truncate">
            {invoice.client.businessName}
          </p>
          <p className="text-[12px] font-mono text-muted-foreground/50 truncate md:hidden">
            {invoice.client.rfc}
          </p>
        </Link>

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

        {/* Actions menu */}
        <div className="hidden md:flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>

              {isDraft && (
                <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}

              {isStamped && (
                <>
                  <DropdownMenuSeparator />
                  {(invoice.xmlUrl || invoice.xmlContent) && (
                    <DropdownMenuItem onClick={() => handleDownload('xml')}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar XML
                    </DropdownMenuItem>
                  )}
                  {invoice.pdfUrl && (
                    <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </DropdownMenuItem>
                  )}
                  {invoice.uuid && (
                    <DropdownMenuItem onClick={handleCopyUuid}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar UUID
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setCancelOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancelar factura
                  </DropdownMenuItem>
                </>
              )}

              {isDraft && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialogs rendered outside the row */}
      {isStamped && (
        <CancelInvoiceDialog
          invoiceId={invoice.id}
          invoiceLabel={folioLabel}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      )}
      {isDraft && (
        <DeleteInvoiceDialog
          invoiceId={invoice.id}
          invoiceLabel={folioLabel}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  )
}
