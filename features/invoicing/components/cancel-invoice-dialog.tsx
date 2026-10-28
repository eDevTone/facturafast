'use client'

import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Input } from '@shared/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cancelInvoiceAction } from '../actions/cancel-invoice.action'
import { getCancellationPreviewAction } from '../actions/get-cancellation-preview.action'
import { CANCELLATION_REASONS, type CancellationReason } from '../constants/cancellation-reasons'
import { cancellationPreviewNotice, SatPreviewLine, type SatPreviewState } from './sat-preview-line'

interface CancelInvoiceDialogProps {
  invoiceId: string
  invoiceLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the invoice cannot be cancelled: the dialog explains why instead of asking for a reason. */
  blockedReason?: string
  /** UUID of the stamped invoice that replaces this one: the request goes with motive 01 and this UUID. */
  substituteUuid?: string | null
  /** The client rejected an earlier request: a new one only goes through if they accept it. */
  rejectedBefore?: boolean
  /** Motive of an earlier request, preselected when asking again. */
  defaultReason?: string | null
}

/** Asks the SAT to cancel a stamped invoice, after saying whether the client will have to accept. */
export function CancelInvoiceDialog({
  invoiceId,
  invoiceLabel,
  open,
  onOpenChange,
  blockedReason,
  substituteUuid,
  rejectedBefore = false,
  defaultReason,
}: CancelInvoiceDialogProps) {
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)
  const initialReason: CancellationReason | '' = substituteUuid
    ? '01'
    : CANCELLATION_REASONS.find((r) => r.value === defaultReason)?.value ?? ''
  const [reason, setReason] = useState<CancellationReason | ''>(initialReason)
  const [replacementUuid, setReplacementUuid] = useState('')
  const [preview, setPreview] = useState<SatPreviewState>({ status: 'idle' })

  // The preview is asked each time the dialog opens; until it arrives the dialog shows "Consultando al SAT…".
  useEffect(() => {
    if (!open || blockedReason) return
    let active = true
    getCancellationPreviewAction(invoiceId).then((result) => {
      if (!active) return
      if (!result.success) {
        setPreview({ status: 'ready', preview: null })
        return
      }
      if (result.preview.cancelled) {
        toast.success('El SAT ya la tiene cancelada')
        onOpenChange(false)
        router.refresh()
        return
      }
      setPreview({ status: 'ready', preview: result.preview })
    })
    return () => {
      active = false
    }
  }, [open, blockedReason, invoiceId, onOpenChange, router])

  const replaced = !!substituteUuid
  const loading = open && !blockedReason && preview.status === 'idle'
  const notice = preview.status === 'ready' && preview.preview
    ? cancellationPreviewNotice(preview.preview, { subject: 'factura', replaced: replaced || reason === '01', rejectedBefore })
    : null
  const uuidToSend = substituteUuid ?? replacementUuid.trim()

  const handleCancel = async () => {
    if (!reason) {
      toast.error('Elige un motivo de cancelación')
      return
    }
    if (reason === '01' && !uuidToSend) {
      toast.error('Escribe el UUID de la factura que la sustituye')
      return
    }

    setIsCancelling(true)
    const result = await cancelInvoiceAction(invoiceId, reason, reason === '01' ? uuidToSend : undefined)
    setIsCancelling(false)

    if (!result.success) {
      toast.error('No se pidió la cancelación', { description: result.error })
      return
    }
    if (result.outcome === 'cancelada') {
      toast.success('Factura cancelada', { description: `El SAT ya reporta cancelada la ${invoiceLabel}.` })
    } else {
      toast.success('Pedimos la cancelación al SAT', {
        description: result.cancellable === 'Cancelable con aceptación'
          ? 'Tu cliente tiene 3 días hábiles para aceptarla o rechazarla.'
          : 'El SAT está procesando la cancelación.',
      })
    }
    handleOpenChange(false)
    router.refresh()
  }

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setReason(initialReason)
      setReplacementUuid('')
      setPreview({ status: 'idle' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar factura</DialogTitle>
          <DialogDescription>
            {blockedReason ? (
              <>
                La factura <strong className="text-foreground">{invoiceLabel}</strong> no se puede cancelar todavía.
              </>
            ) : replaced ? (
              <>
                Pediremos al SAT cancelar la <strong className="text-foreground">{invoiceLabel}</strong> con el motivo 01,
                porque ya la sustituiste.
              </>
            ) : (
              <>
                Pediremos al SAT cancelar la factura <strong className="text-foreground">{invoiceLabel}</strong>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {blockedReason ? (
          <p className="rounded-[4px] border border-ocre/40 bg-ocre-tenue px-3 py-2 text-[13px] text-tinta">
            {blockedReason}
          </p>
        ) : (
          <div className="space-y-4">
            {replaced ? (
              <div className="space-y-1 text-[13px]">
                <p className="text-tinta-tenue">Factura que la sustituye</p>
                <p className="break-all font-mono text-tinta">{substituteUuid}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="cancel-reason" className="text-[13px] font-medium text-tinta-tenue">
                  Motivo
                </label>
                <Select value={reason} onValueChange={(value) => setReason(value as CancellationReason)}>
                  <SelectTrigger id="cancel-reason">
                    <SelectValue placeholder="¿Por qué la cancelas?" />
                  </SelectTrigger>
                  <SelectContent>
                    {CANCELLATION_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        <span className="font-mono text-tinta-tenue">{r.value}</span> {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reason === '02' && (
                  <p className="text-[12px] text-tinta-tenue">
                    Úsalo también si el RFC del cliente estaba mal; después emite la factura correcta.
                  </p>
                )}
              </div>
            )}

            {reason === '01' && !replaced && (
              <div className="space-y-2">
                <label htmlFor="replacement-uuid" className="text-[13px] font-medium text-tinta-tenue">
                  UUID de la factura que la sustituye
                </label>
                <Input
                  id="replacement-uuid"
                  value={replacementUuid}
                  onChange={(e) => setReplacementUuid(e.target.value)}
                  placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                  className="font-mono text-sm"
                />
                <p className="text-[12px] text-tinta-tenue">
                  ¿Aún no la sustituyes? Usa &ldquo;Corregir factura&rdquo;: crea la nueva y pide esta cancelación por ti.
                </p>
              </div>
            )}

            <SatPreviewLine loading={loading} notice={notice} />
          </div>
        )}

        <DialogFooter className={blockedReason ? 'sm:justify-end' : 'items-center sm:justify-between'}>
          {!blockedReason && <p className="text-[12px] text-tinta-tenue">Cancelar no gasta timbres.</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCancelling}>
              Cerrar
            </Button>
            {!blockedReason && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isCancelling || !reason || loading || !!notice?.blocks}
              >
                {isCancelling && <Loader2 className="animate-spin" />}
                {isCancelling ? 'Pidiendo…' : 'Pedir cancelación'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
