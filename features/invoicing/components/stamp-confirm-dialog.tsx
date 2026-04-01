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
import { Send, Zap } from 'lucide-react'

interface StampConfirmDialogProps {
  onConfirm: () => void
  disabled?: boolean
  isStamping?: boolean
  clientEmail?: string | null
}

export function StampConfirmDialog({ onConfirm, disabled, isStamping, clientEmail }: StampConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled || isStamping}>
          <Send className="h-4 w-4 mr-2" />
          {isStamping ? 'Timbrando...' : 'Timbrar'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Timbrar esta factura?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Esta acción es irreversible. Al timbrar:</p>
              <ul className="space-y-2 text-[13px]">
                <li className="flex items-start gap-2">
                  <Zap className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  <span>Se consumirá <strong className="text-foreground">1 timbre</strong> de tu plan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Send className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span>La factura se enviará al SAT y no podrá editarse</span>
                </li>
                {clientEmail && (
                  <li className="flex items-start gap-2">
                    <span className="text-[13px] text-muted-foreground">📧</span>
                    <span>
                      Se enviará el XML y PDF a{' '}
                      <strong className="text-foreground">{clientEmail}</strong>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Confirmar y timbrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
