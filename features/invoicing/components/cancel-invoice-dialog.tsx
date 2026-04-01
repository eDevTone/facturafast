'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { cancelInvoiceAction } from '../actions/cancel-invoice.action'
import { CANCELLATION_REASONS } from '../constants/cancellation-reasons'

interface CancelInvoiceDialogProps {
  invoiceId: string
  invoiceLabel: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CancelInvoiceDialog({ invoiceId, invoiceLabel, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CancelInvoiceDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [replacementUuid, setReplacementUuid] = useState('')

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen

  const handleCancel = async () => {
    if (!reason) {
      toast.error('Selecciona un motivo de cancelación')
      return
    }

    if (reason === '01' && !replacementUuid.trim()) {
      toast.error('El UUID de sustitución es requerido para el motivo 01')
      return
    }

    setIsCancelling(true)

    const result = await cancelInvoiceAction(
      invoiceId,
      reason as '01' | '02' | '03' | '04',
      reason === '01' ? replacementUuid.trim() : undefined,
    )

    if (result.success) {
      toast.success('Factura cancelada correctamente')
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || 'Error al cancelar la factura')
    }

    setIsCancelling(false)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setReason('')
      setReplacementUuid('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" className="text-destructive hover:text-destructive">
            <Ban className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar factura</DialogTitle>
          <DialogDescription>
            Estás a punto de cancelar la factura{' '}
            <strong className="text-foreground">{invoiceLabel}</strong>.
            Esta acción se reportará al SAT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Motivo de cancelación
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === '01' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                UUID de factura sustituta
              </label>
              <Input
                value={replacementUuid}
                onChange={(e) => setReplacementUuid(e.target.value)}
                placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isCancelling}
          >
            Cerrar
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling || !reason}
          >
            {isCancelling ? 'Cancelando...' : 'Confirmar cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
