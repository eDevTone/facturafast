'use client'

import { CollectionLabel } from '@features/collections/components/collection-label'
import type { CollectionState } from '@features/collections/utils/collection-state'
import { formatDateShort } from '@shared/utils/date'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { Ban, Copy, Download, Eye, FilePen, Files, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { duplicateInvoiceAction } from '../actions/duplicate-invoice.action'
import { downloadInvoiceFile, type InvoiceFileType } from '../utils/download-invoice-file'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { formatCurrency } from '../utils/invoice-calculations'
import { CANCEL_BLOCKED_BY_PAYMENTS } from '../constants/cancellation-reasons'
import { invoiceStampState } from '../utils/cancellation-state'
import { correctionBlockReason } from '../utils/correction'
import { CancelInvoiceDialog } from './cancel-invoice-dialog'
import { CorrectInvoiceDialog } from './correct-invoice-dialog'
import { DeleteInvoiceDialog } from './delete-invoice-dialog'
import { Folio } from './folio'
import { StatusBadge } from './status-badge'

/**
 * One invoice in the list. `paid` is what its complementos de pago collected; `collection` says
 * what is still owed: "Por cobrar", "Saldo $X", "Vencida" or "Pagada".
 */
export function InvoiceRow({
  invoice,
  paid = 0,
  collection = null,
}: {
  invoice: InvoiceWithRelations
  paid?: number
  collection?: CollectionState | null
}) {
  const router = useRouter()
  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada'
  const isCancelled = invoice.status === 'cancelada'
  const [cancelOpen, setCancelOpen] = useState(false)
  const [correctOpen, setCorrectOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const stampState = invoiceStampState(invoice)
  const hasActivePayments = paid > 0

  const handleDownload = async (type: InvoiceFileType) => {
    const ok = await downloadInvoiceFile(invoice, type)
    if (!ok) toast.error('El archivo aún no está disponible')
  }

  const handleDuplicate = async () => {
    const result = await duplicateInvoiceAction(invoice.id)
    if (result.success) {
      toast.success('Borrador creado a partir de esta factura')
      router.push(`/invoices/${result.invoiceId}/edit`)
    } else {
      toast.error('No se pudo duplicar', { description: result.error })
    }
  }

  const handleCopyUuid = () => {
    if (!invoice.uuid) return
    navigator.clipboard.writeText(invoice.uuid)
    toast.success('UUID copiado')
  }

  return (
    <>
      <div className="group relative grid grid-cols-[1fr_auto_28px] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-sello-tenue/40 lg:grid-cols-[136px_1fr_80px_136px_120px_32px] lg:px-5">
        {/* Folio (the whole row is clickable through this link) */}
        <Link href={`/invoices/${invoice.id}`} className="order-1 flex min-w-0 items-center gap-2 after:absolute after:inset-0">
          <Folio serie={invoice.serie} folio={invoice.folio} className="min-w-0 truncate text-sm" />
          <span className="lg:hidden">
            <StatusBadge invoice={invoice} />
          </span>
        </Link>

        {/* Total — mobile sits next to the folio; a PPD invoice adds what is still owed */}
        <div className="order-2 text-right lg:order-5">
          <p className="font-mono text-sm">{formatCurrency(parseFloat(invoice.total), invoice.currency)}</p>
          <CollectionLabel state={collection} paymentMethod={invoice.paymentMethod} currency={invoice.currency} className="mt-0.5" />
        </div>

        {/* Client */}
        <div className="order-4 min-w-0 lg:order-2">
          <p className="truncate text-sm leading-tight">{invoice.client.businessName}</p>
          <p className="mt-0.5 truncate text-[12px] text-tinta-tenue">
            <span className="font-mono">{invoice.client.rfc}</span>
            {invoice.recurringInvoiceId && <span className="text-sello"> · Cada mes</span>}
          </p>
        </div>

        {/* Date */}
        <p className="order-5 col-span-2 text-right text-[13px] tabular-nums text-tinta-tenue lg:order-3 lg:col-span-1 lg:text-left">
          {formatDateShort(invoice.stampedAt ?? invoice.issuedAt)}
        </p>

        {/* Status — desktop */}
        <div className="hidden lg:order-4 lg:block">
          <StatusBadge invoice={invoice} />
        </div>

        {/* Actions menu */}
        <div className="relative z-10 order-3 flex justify-end lg:order-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Acciones de la factura ${folioLabel}`}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[4px] text-tinta-tenue transition-colors hover:bg-muted hover:text-tinta"
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

              <DropdownMenuItem onClick={handleDuplicate}>
                <Files className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>

              {(isStamped || isCancelled) && (
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
                  {isCancelled && invoice.cancellationAcuseUrl && (
                    <DropdownMenuItem onClick={() => handleDownload('acuse')}>
                      <Download className="h-4 w-4 mr-2" />
                      Acuse de cancelación
                    </DropdownMenuItem>
                  )}
                  {invoice.uuid && (
                    <DropdownMenuItem onClick={handleCopyUuid}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar UUID
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {isStamped && stampState === 'timbrada' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setCorrectOpen(true)}>
                    <FilePen className="h-4 w-4 mr-2" />
                    Corregir factura
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCancelOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancelar factura
                  </DropdownMenuItem>
                </>
              )}
              {(stampState === 'por_cancelar' || stampState === 'cancelacion_rechazada') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setCancelOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {stampState === 'por_cancelar' ? 'Pedir cancelación' : 'Volver a pedir la cancelación'}
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

      {isStamped && (
        <>
          <CancelInvoiceDialog
            invoiceId={invoice.id}
            invoiceLabel={folioLabel}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            blockedReason={hasActivePayments ? CANCEL_BLOCKED_BY_PAYMENTS : undefined}
            substituteUuid={invoice.cancellationSubstituteUuid}
            defaultReason={invoice.cancellationReason}
            rejectedBefore={stampState === 'cancelacion_rechazada'}
          />
          <CorrectInvoiceDialog
            invoiceId={invoice.id}
            invoiceLabel={folioLabel}
            open={correctOpen}
            onOpenChange={setCorrectOpen}
            blockedReason={correctionBlockReason(invoice, { hasActivePayments })}
          />
        </>
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
