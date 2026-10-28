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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createRecurringInvoiceAction, updateRecurringSettingsAction } from '../actions/recurring.actions'
import type { RecurringMode } from '../services/recurring.service'
import { fillPeriod, hasPeriodTokens, periodFor, tokenizeDescriptions } from '../utils/period'
import { DAY_OPTIONS, LAST_DAY, monthOf, nextRunOn } from '../utils/schedule'

interface RepeatMonthlyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Today in Mexico City, YYYY-MM-DD. */
  today: string
  clientName: string
  /** "Repetir cada mes" on a stamped invoice. */
  invoice?: { id: string; issuedDay: string; descriptions: string[] }
  /** Or the settings of one that already repeats. */
  recurring?: {
    id: string
    dayOfMonth: number
    mode: RecurringMode
    periodOffset: number
    lastRunOn: string | null
    /** Template descriptions, with their tokens. */
    descriptions: string[]
  }
}

const MODES: { value: RecurringMode; label: string; hint: string }[] = [
  {
    value: 'draft',
    label: 'Dejar borrador y avisarme',
    hint: 'Te llega un correo para que la revises y la timbres.',
  },
  {
    value: 'stamp',
    label: 'Timbrarla y mandarla',
    hint: 'Se timbra y le llega a tu cliente con el PDF y el XML. Si no tienes timbres, queda como borrador y te avisamos.',
  },
]

const OFFSETS = [
  { value: -1, label: 'Mes anterior' },
  { value: 0, label: 'Mismo mes' },
  { value: 1, label: 'Mes siguiente' },
]

/** A day of an invoice as the day of the month to repeat it on: 29 to 31 become "Último día". */
function dayOfIssue(day: string): number {
  const dayOfMonth = Number(day.slice(8, 10))
  return dayOfMonth > 28 ? LAST_DAY : dayOfMonth
}

/**
 * "Repetir cada mes": the day, what the app does that day, and which month the descriptions name.
 * Shows when the first one comes out and how its description will read.
 */
export function RepeatMonthlyDialog({ open, onOpenChange, today, clientName, invoice, recurring }: RepeatMonthlyDialogProps) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()

  // The descriptions with their month as tokens, and the offset found in them.
  const tokenized = useMemo(() => {
    if (recurring) {
      return {
        descriptions: recurring.descriptions,
        periodOffset: recurring.periodOffset,
        detected: recurring.descriptions.some(hasPeriodTokens),
      }
    }
    return tokenizeDescriptions(invoice?.descriptions ?? [], monthOf(invoice?.issuedDay ?? today))
  }, [recurring, invoice, today])

  const [dayOfMonth, setDayOfMonth] = useState(recurring?.dayOfMonth ?? dayOfIssue(invoice?.issuedDay ?? today))
  const [mode, setMode] = useState<RecurringMode>(recurring?.mode ?? 'draft')
  const [periodOffset, setPeriodOffset] = useState(tokenized.periodOffset)

  // The invoice it starts from already covers its own month.
  const lastRunOn = recurring ? recurring.lastRunOn : invoice?.issuedDay ?? null
  const firstRun = nextRunOn(dayOfMonth, today, lastRunOn)
  const sample = tokenized.descriptions.find(hasPeriodTokens)
  const samplePeriod = periodFor(monthOf(firstRun), periodOffset)

  const handleSave = () => {
    startSaving(async () => {
      const settings = { dayOfMonth, mode, periodOffset }
      const result = recurring
        ? await updateRecurringSettingsAction(recurring.id, settings)
        : invoice
          ? await createRecurringInvoiceAction(invoice.id, settings)
          : null
      if (!result) return
      if (!result.success) {
        toast.error(recurring ? 'No se guardaron los cambios' : 'No se programó la factura', { description: result.error })
        return
      }
      toast.success(recurring ? 'Cambios guardados' : 'Se repetirá cada mes', {
        description: `La siguiente sale el ${formatDayLong(result.recurring.nextRunOn)}.`,
      })
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{recurring ? 'Cambiar repetición' : 'Repetir cada mes'}</DialogTitle>
          <DialogDescription>
            Cada mes hacemos esta factura para {clientName}, con los mismos conceptos y montos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="repeat-day" className="text-[13px] font-medium text-tinta-tenue">
              Día del mes
            </label>
            <Select value={String(dayOfMonth)} onValueChange={(value) => setDayOfMonth(Number(value))}>
              <SelectTrigger id="repeat-day" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {DAY_OPTIONS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day === LAST_DAY ? 'Último día' : `Día ${day}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p id="repeat-mode" className="text-[13px] font-medium text-tinta-tenue">Ese día</p>
            <div className="grid gap-1 rounded-md border border-input bg-hoja p-0.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="repeat-mode">
              {MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === option.value}
                  onClick={() => setMode(option.value)}
                  className={cn(
                    'min-h-8 rounded-[4px] px-2 py-1.5 text-[13px] transition-colors',
                    mode === option.value ? 'bg-sello-tenue font-medium text-tinta' : 'text-tinta-tenue hover:text-tinta',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-tinta-tenue">{MODES.find((option) => option.value === mode)?.hint}</p>
          </div>

          {tokenized.detected && sample && (
            <div className="space-y-2">
              <p id="repeat-period" className="text-[13px] font-medium text-tinta-tenue">El mes que dice la descripción</p>
              <div className="grid grid-cols-3 gap-1 rounded-md border border-input bg-hoja p-0.5" role="radiogroup" aria-labelledby="repeat-period">
                {OFFSETS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={periodOffset === option.value}
                    onClick={() => setPeriodOffset(option.value)}
                    className={cn(
                      'h-8 rounded-[4px] text-[13px] transition-colors',
                      periodOffset === option.value ? 'bg-sello-tenue font-medium text-tinta' : 'text-tinta-tenue hover:text-tinta',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-[12px] text-tinta-tenue">
                La del {formatDayLong(firstRun)} dirá: <span className="text-tinta">«{fillPeriod(sample, samplePeriod)}»</span>
              </p>
            </div>
          )}

          <p className="border-t border-renglon pt-3 text-sm">
            La {recurring ? 'siguiente' : 'primera'} sale el <span className="font-medium">{formatDayLong(firstRun)}</span>.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" />}
            {recurring ? 'Guardar cambios' : 'Repetir cada mes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
