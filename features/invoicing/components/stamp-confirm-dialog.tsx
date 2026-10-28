'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui/alert-dialog'
import { Button } from '@shared/ui/button'
import { Loader2, Stamp } from 'lucide-react'
import { formatCurrency } from '../utils/invoice-calculations'

interface StampConfirmDialogProps {
  onConfirm: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /** Why the button is disabled, shown as its tooltip. */
  disabledReason?: string
  isStamping?: boolean
  clientName: string
  clientEmail?: string | null
  total: number
  hasWithholdings: boolean
  stampsBalance: number
  /** "A-3": the invoice this correction replaces; stamping asks the SAT to cancel it. */
  replacesLabel?: string
  /** Currency of the invoice. */
  currency?: string
}

/** Last check before stamping: who, how much, and what it costs. */
export function StampConfirmDialog({
  onConfirm,
  open,
  onOpenChange,
  disabled,
  disabledReason,
  isStamping,
  clientName,
  clientEmail,
  total,
  hasWithholdings,
  stampsBalance,
  replacesLabel,
  currency = 'MXN',
}: StampConfirmDialogProps) {
  const noStamps = stampsBalance < 1

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled || isStamping} title={disabled ? disabledReason : undefined}>
          {isStamping ? <Loader2 className="animate-spin" /> : <Stamp />}
          {isStamping ? 'Timbrando…' : 'Timbrar'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Timbrar factura</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm text-tinta-tenue">
              <dl className="divide-y divide-renglon border-y border-renglon">
                <div className="flex justify-between gap-4 py-2">
                  <dt>Cliente</dt>
                  <dd className="truncate text-right text-tinta">{clientName}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt>{hasWithholdings ? 'Neto a recibir' : 'Total'}</dt>
                  <dd className="font-mono text-tinta">{formatCurrency(total, currency)}</dd>
                </div>
                {replacesLabel && (
                  <div className="flex justify-between gap-4 py-2">
                    <dt>Sustituye a</dt>
                    <dd className="text-right text-tinta">
                      <span className="font-mono">{replacesLabel}</span>, que se cancela con el motivo 01
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 py-2">
                  <dt>Timbres</dt>
                  <dd className={noStamps ? 'text-tinta-roja' : 'text-tinta'}>
                    <span className="font-mono">{stampsBalance}</span> {stampsBalance === 1 ? 'disponible' : 'disponibles'} · usa 1
                  </dd>
                </div>
              </dl>
              <p>
                {replacesLabel
                  ? `Se envía al SAT y después pedimos cancelar la ${replacesLabel}.`
                  : 'Se envía al SAT y ya no se puede editar; si te equivocas, puedes corregirla.'}
                {clientEmail && (
                  <> Enviaremos el XML y el PDF a <span className="text-tinta">{clientEmail}</span>.</>
                )}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Revisar de nuevo</AlertDialogCancel>
          {noStamps ? (
            <AlertDialogAction asChild>
              <a href="/billing">Comprar timbres</a>
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={onConfirm}>Timbrar ahora</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
