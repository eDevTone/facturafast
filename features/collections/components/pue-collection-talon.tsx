'use client'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { formatDay, formatDayLong } from '@features/payments/utils/payment-dates'
import { SectionLabel } from '@shared/components/section-label'
import { Button } from '@shared/ui/button'
import { BellRing, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { setAwaitingPaymentAction } from '../actions/set-awaiting-payment.action'
import type { CollectionState } from '../utils/collection-state'
import { dueLabel } from '../utils/due-date'

interface PueCollectionTalonProps {
  invoiceId: string
  state: CollectionState
  currency: string
  /** Today in Mexico City, YYYY-MM-DD. */
  today: string
  onRemind: () => void
  /** Opens "Sustituir por una factura PPD". */
  onReplaceWithPpd: () => void
}

/**
 * The talón of a PUE invoice still awaiting payment: what is owed, until when the SAT lets it be
 * PUE (the end of the month it was issued), and the way out when the payment comes later.
 */
export function PueCollectionTalon({ invoiceId, state, currency, today, onRemind, onReplaceWithPpd }: PueCollectionTalonProps) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const overdue = state.status === 'vencida'

  const handlePaid = () => {
    startSaving(async () => {
      const result = await setAwaitingPaymentAction(invoiceId, false)
      if (!result.success) {
        toast.error('No se marcó como cobrada', { description: result.error })
        return
      }
      toast.success('Factura cobrada')
      router.refresh()
    })
  }

  return (
    <section className="talon space-y-3 px-5 pb-6 pt-7 sm:px-8" aria-label="Cobro de la factura">
      <SectionLabel>Cobro</SectionLabel>

      {state.pueExpired ? (
        <p className="rounded-[4px] border border-ocre/40 bg-ocre-tenue px-3 py-2 text-[13px] text-tinta">
          No se pagó a más tardar el {formatDayLong(state.dueDate ?? today)}. Para una factura PUE, el SAT pide
          cancelarla y emitir una PPD que la sustituya; cada pago que recibas llevará su complemento.{' '}
          <button type="button" onClick={onReplaceWithPpd} className="font-medium text-sello underline underline-offset-2">
            Sustituir por una factura PPD
          </button>
        </p>
      ) : (
        <p className="text-[13px] text-tinta-tenue">
          Es PUE: el SAT pide que te la paguen completa a más tardar el último día del mes en que la emitiste. Si te
          pagarán después,{' '}
          <button type="button" onClick={onReplaceWithPpd} className="text-sello underline underline-offset-2">
            sustitúyela por una PPD
          </button>
          .
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handlePaid} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
          Ya me pagaron
        </Button>
        <Button variant="outline" size="sm" onClick={onRemind}>
          <BellRing />
          Recordar pago
        </Button>
      </div>

      <div className="flex items-baseline justify-between gap-4 border-t border-tinta/70 pt-3">
        <span className="text-sm font-medium">Por cobrar</span>
        <span className="font-mono text-lg font-medium tracking-tight">{formatCurrency(state.balance, currency)}</span>
      </div>
      {state.dueDate && (
        <p className={cn('text-right text-[12px]', overdue ? 'text-tinta-roja' : 'text-tinta-tenue')}>
          {dueLabel(state.dueDate, today)} · <span className="font-mono">{formatDay(state.dueDate)}</span>
        </p>
      )}
    </section>
  )
}
