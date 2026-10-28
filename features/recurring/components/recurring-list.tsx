'use client'

import { cn } from '@/lib/utils'
import { Folio } from '@features/invoicing/components/folio'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { CalendarCog, ListPlus, Loader2, MoreHorizontal, Pause, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { deleteRecurringInvoiceAction, setRecurringActiveAction } from '../actions/recurring.actions'
import type { RecurringListItem } from '../services/recurring.service'
import { LAST_DAY } from '../utils/schedule'
import { RepeatMonthlyDialog } from './repeat-monthly-dialog'

/** "Día 1 · Dejar borrador" */
function scheduleLabel(item: RecurringListItem): string {
  const day = item.dayOfMonth === LAST_DAY ? 'Último día' : `Día ${item.dayOfMonth}`
  return `${day} · ${item.mode === 'stamp' ? 'Timbrar y mandar' : 'Dejar borrador'}`
}

/** "Facturas de cada mes": each one with its next date and what the app does that day. */
export function RecurringList({ items, today }: { items: RecurringListItem[]; today: string }) {
  if (items.length === 0) {
    return (
      <div className="hoja-borrador px-6 py-14 text-center">
        <h2 className="text-base font-semibold">Aún no repites ninguna factura</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
          Abre una factura timbrada, toca «Más acciones» y elige «Repetir cada mes». Cada mes la hacemos por ti.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/invoices">Ir a Facturas</Link>
        </Button>
      </div>
    )
  }

  return (
    <ul className="hoja divide-y divide-renglon">
      {items.map((item) => (
        <RecurringRow key={item.id} item={item} today={today} />
      ))}
    </ul>
  )
}

function RecurringRow({ item, today }: { item: RecurringListItem; today: string }) {
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleActive = (active: boolean) => {
    startTransition(async () => {
      const result = await setRecurringActiveAction(item.id, active)
      if (!result.success) {
        toast.error('No se guardaron los cambios', { description: result.error })
        return
      }
      toast.success(active ? 'Reanudada' : 'En pausa', {
        description: active ? `La siguiente sale el ${formatDayLong(result.recurring.nextRunOn)}.` : 'No haremos más facturas hasta que la reanudes.',
      })
      router.refresh()
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRecurringInvoiceAction(item.id)
      if (!result.success) {
        toast.error('No se pudo dejar de repetir', { description: result.error })
        return
      }
      toast.success('Ya no se repite', { description: 'Las facturas que ya hicimos se quedan como están.' })
      setDeleteOpen(false)
      router.refresh()
    })
  }

  const next = item.active ? `Siguiente: ${formatDayLong(item.nextRunOn)}` : 'En pausa'

  return (
    <li className={cn('flex items-start gap-2 px-5 py-4 sm:px-6', !item.active && 'opacity-70')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium">{item.clientName}</p>
          <p className="shrink-0 font-mono text-sm">{formatCurrency(item.total, item.currency)}</p>
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-[13px] text-tinta-tenue">{item.description}</p>
          <p className={cn('hidden shrink-0 text-[12px] sm:block', item.active ? 'text-tinta-tenue' : 'text-ocre')}>{next}</p>
        </div>
        <p className="mt-1 text-[12px] text-tinta-tenue">
          {/* On a phone the next date joins this line */}
          <span className={cn('sm:hidden', !item.active && 'text-ocre')}>{next} · </span>
          {scheduleLabel(item)}
          {item.lastInvoice && (
            <>
              {' · Última: '}
              <Link href={`/invoices/${item.lastInvoice.id}`} className="underline-offset-2 hover:text-tinta hover:underline">
                <Folio serie={item.lastInvoice.serie} folio={item.lastInvoice.folio} />
              </Link>
            </>
          )}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-1.5 shrink-0" aria-label={`Acciones de ${item.clientName}`} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <CalendarCog className="mr-2 h-4 w-4" />
            Cambiar día y modo
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/invoices/recurring/${item.id}/edit`}>
              <ListPlus className="mr-2 h-4 w-4" />
              Cambiar conceptos
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleActive(!item.active)}>
            {item.active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {item.active ? 'Pausar' : 'Reanudar'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Dejar de repetir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RepeatMonthlyDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        today={today}
        clientName={item.clientName}
        recurring={{
          id: item.id,
          dayOfMonth: item.dayOfMonth,
          mode: item.mode,
          periodOffset: item.periodOffset,
          lastRunOn: item.lastRunOn,
          descriptions: item.descriptions,
        }}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dejar de repetir</DialogTitle>
            <DialogDescription>
              Ya no haremos la factura de {item.clientName} cada mes. Las que ya hicimos se quedan como están.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Dejar de repetir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}
