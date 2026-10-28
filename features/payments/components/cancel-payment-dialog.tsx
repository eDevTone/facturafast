'use client'

import { cancellationPreviewNotice, SatPreviewLine, type SatPreviewState } from '@features/invoicing/components/sat-preview-line'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cancelPaymentAction } from '../actions/cancel-payment.action'
import { getPaymentCancellationPreviewAction } from '../actions/get-payment-cancellation-preview.action'

type ManualReason = '02' | '03'

const REASONS: { value: ManualReason; label: string }[] = [
  { value: '02', label: 'Tenía errores y no lo voy a sustituir' },
  { value: '03', label: 'El cobro no ocurrió' },
]

interface CancelPaymentDialogProps {
  paymentId: string
  invoiceId: string
  /** "P-2" */
  paymentLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** UUID of the complemento that replaces this one: the request goes with motive 01 and this UUID. */
  substituteUuid?: string | null
  /** The client rejected an earlier request: a new one only goes through if they accept it. */
  rejectedBefore?: boolean
  /** Motive of an earlier request, preselected when asking again. */
  defaultReason?: string | null
}

/** Asks the SAT to cancel a complemento de pago; once cancelled, its amount returns to the invoice balance. */
export function CancelPaymentDialog({
  paymentId,
  invoiceId,
  paymentLabel,
  open,
  onOpenChange,
  substituteUuid,
  rejectedBefore = false,
  defaultReason,
}: CancelPaymentDialogProps) {
  const router = useRouter()
  const initialReason = REASONS.find((r) => r.value === defaultReason)?.value ?? ''
  const [reason, setReason] = useState<ManualReason | ''>(initialReason)
  const [isCancelling, setIsCancelling] = useState(false)
  const [preview, setPreview] = useState<SatPreviewState>({ status: 'idle' })
  const replaced = !!substituteUuid

  // Asked each time the dialog opens; until it arrives the dialog shows "Consultando al SAT…".
  useEffect(() => {
    if (!open) return
    let active = true
    getPaymentCancellationPreviewAction(paymentId).then((result) => {
      if (!active) return
      if (result.success && result.preview.cancelled) {
        toast.success('El SAT ya lo tiene cancelado')
        onOpenChange(false)
        router.refresh()
        return
      }
      setPreview({ status: 'ready', preview: result.success ? result.preview : null })
    })
    return () => {
      active = false
    }
  }, [open, paymentId, onOpenChange, router])

  const loading = open && preview.status === 'idle'
  const notice = preview.status === 'ready' && preview.preview
    ? cancellationPreviewNotice(preview.preview, { subject: 'complemento', replaced, rejectedBefore })
    : null

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      setReason(initialReason)
      setPreview({ status: 'idle' })
    }
  }

  const handleCancel = async () => {
    const motive = replaced ? '01' : reason
    if (!motive) {
      toast.error('Elige un motivo de cancelación')
      return
    }
    setIsCancelling(true)
    const result = await cancelPaymentAction(paymentId, invoiceId, motive, substituteUuid ?? undefined)
    setIsCancelling(false)

    if (!result.success) {
      toast.error('No se pidió la cancelación', { description: result.error })
      return
    }
    if (result.outcome === 'cancelado') {
      toast.success('Complemento cancelado', {
        description: replaced ? `El SAT ya reporta cancelado el ${paymentLabel}.` : 'Su monto volvió al saldo de la factura.',
      })
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar cobro</DialogTitle>
          <DialogDescription>
            {replaced ? (
              <>
                Pediremos al SAT cancelar el complemento <strong className="text-foreground">{paymentLabel}</strong> con
                el motivo 01, porque ya lo sustituiste.
              </>
            ) : (
              <>
                Pediremos al SAT cancelar el complemento <strong className="text-foreground">{paymentLabel}</strong>.
                Cuando lo confirme, su monto vuelve al saldo de la factura.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {replaced ? (
            <div className="space-y-1 text-[13px]">
              <p className="text-tinta-tenue">Complemento que lo sustituye</p>
              <p className="break-all font-mono text-tinta">{substituteUuid}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="cancel-payment-reason" className="text-[13px] font-medium text-tinta-tenue">
                Motivo
              </label>
              <Select value={reason} onValueChange={(value) => setReason(value as ManualReason)}>
                <SelectTrigger id="cancel-payment-reason">
                  <SelectValue placeholder="¿Por qué lo cancelas?" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="font-mono text-tinta-tenue">{r.value}</span> {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[12px] text-tinta-tenue">
                Si solo cambia un dato del cobro, mejor usa &ldquo;Corregir cobro&rdquo;: conserva la parcialidad.
              </p>
            </div>
          )}

          <SatPreviewLine loading={loading} notice={notice} />
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-[12px] text-tinta-tenue">Cancelar no gasta timbres.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isCancelling}>
              Cerrar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling || (!replaced && !reason) || loading || !!notice?.blocks}
            >
              {isCancelling && <Loader2 className="animate-spin" />}
              {isCancelling ? 'Pidiendo…' : 'Pedir cancelación'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
