'use client'

import { formatDayLong } from '@features/payments/utils/payment-dates'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { correctInvoiceAction } from '../actions/correct-invoice.action'
import { getCancellationPreviewAction } from '../actions/get-cancellation-preview.action'
import type { CancellationPreview } from '../types/invoice.types'
import { SatPreviewLine, type SatPreviewNotice, type SatPreviewState } from './sat-preview-line'

interface CorrectInvoiceDialogProps {
  invoiceId: string
  invoiceLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the invoice cannot be corrected now: the dialog explains why. */
  blockedReason?: string | null
  /**
   * "Sustituir por una factura PPD": a PUE invoice not paid within its month is replaced by a
   * PPD one with FormaPago 99 (RMF 2026, regla 2.7.1.39).
   */
  toPpd?: boolean
}

/** What the SAT says about the cancellation the correction will ask for. */
function previewNotice(preview: CancellationPreview): SatPreviewNotice | null {
  if (preview.expired) {
    return {
      text: `Ya venció el plazo para cancelarla (el SAT lo permitía hasta el ${formatDayLong(preview.deadline)} de ${preview.deadline.slice(0, 4)}), así que tampoco se puede sustituir.`,
      tone: 'warn',
      blocks: true,
    }
  }
  switch (preview.cancellable) {
    case 'Cancelable sin aceptación':
      return { text: 'Su cancelación no necesitará que tu cliente acepte.', tone: 'info' }
    case 'Cancelable con aceptación':
      return { text: 'Tu cliente tendrá que aceptar su cancelación; tiene 3 días hábiles para responder.', tone: 'info' }
    case 'No cancelable':
      return { text: 'El SAT la marca "No cancelable" por otros comprobantes relacionados; con la sustitución sí procede.', tone: 'info' }
    default:
      return null
  }
}

/**
 * "Corregir factura": opens a draft equal to the invoice. Stamping it replaces the invoice
 * (TipoRelacion 04) and asks the SAT to cancel this one with motive 01.
 */
export function CorrectInvoiceDialog({ invoiceId, invoiceLabel, open, onOpenChange, blockedReason, toPpd = false }: CorrectInvoiceDialogProps) {
  const router = useRouter()
  const [isCreating, startCreating] = useTransition()
  const [preview, setPreview] = useState<SatPreviewState>({ status: 'idle' })

  // Asked each time the dialog opens; until it arrives the dialog shows "Consultando al SAT…".
  useEffect(() => {
    if (!open || blockedReason) return
    let active = true
    getCancellationPreviewAction(invoiceId).then((result) => {
      if (active) setPreview({ status: 'ready', preview: result.success ? result.preview : null })
    })
    return () => {
      active = false
    }
  }, [open, blockedReason, invoiceId])

  const loading = open && !blockedReason && preview.status === 'idle'
  const notice = preview.status === 'ready' && preview.preview ? previewNotice(preview.preview) : null

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) setPreview({ status: 'idle' })
  }

  const handleCreate = () => {
    startCreating(async () => {
      const result = await correctInvoiceAction(invoiceId, { toPpd })
      if (!result.success) {
        toast.error('No se creó la corrección', { description: result.error })
        return
      }
      router.push(`/invoices/${result.invoiceId}/edit`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{toPpd ? 'Sustituir por una factura PPD' : 'Corregir factura'}</DialogTitle>
          <DialogDescription>
            {blockedReason ? (
              <>
                La factura <strong className="text-foreground">{invoiceLabel}</strong> no se puede corregir ahora.
              </>
            ) : toPpd ? (
              <>
                Creamos un borrador igual a la <strong className="text-foreground">{invoiceLabel}</strong>, con método
                PPD (pago después) y forma de pago 99. Así lo pide el SAT cuando una factura PUE no se paga en su mes.
                Al timbrarlo, pediremos cancelar la {invoiceLabel} con el motivo 01 (sustitución), y cada pago que
                recibas llevará su complemento.
              </>
            ) : (
              <>
                Creamos un borrador igual a la <strong className="text-foreground">{invoiceLabel}</strong> para que
                corrijas lo que esté mal. Al timbrarlo, pediremos al SAT cancelar la {invoiceLabel} con el motivo 01
                (sustitución).
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {blockedReason ? (
          <p className="rounded-[4px] border border-ocre/40 bg-ocre-tenue px-3 py-2 text-[13px] text-tinta">
            {blockedReason}
          </p>
        ) : (
          <div className="space-y-3 text-[13px] text-tinta-tenue">
            <SatPreviewLine loading={loading} notice={notice} />
            {!toPpd && (
              <p>
                Si lo que estaba mal es el RFC del cliente, el SAT pide otro camino: cancélala con el motivo 02 y después
                emite la factura correcta.
              </p>
            )}
            <p>Timbrar la nueva usa 1 timbre; cancelar la anterior no gasta timbres.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCreating}>
            Cerrar
          </Button>
          {!blockedReason && (
            <Button onClick={handleCreate} disabled={isCreating || loading || !!notice?.blocks}>
              {isCreating && <Loader2 className="animate-spin" />}
              Crear borrador
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
