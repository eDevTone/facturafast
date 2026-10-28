import { cn } from '@/lib/utils'
import { formatDayLong } from '@features/payments/utils/payment-dates'
import { Loader2 } from 'lucide-react'
import type { CancellationPreview } from '../types/invoice.types'

/** The SAT preview of a dialog: not asked yet (`idle`) or answered (null when the action failed). */
export type SatPreviewState = { status: 'idle' } | { status: 'ready'; preview: CancellationPreview | null }

/** One line about what the SAT says; `blocks` hides the dialog's confirm button. */
export interface SatPreviewNotice {
  text: string
  tone: 'info' | 'warn' | 'muted'
  blocks?: boolean
}

/**
 * What the SAT says about cancelling an invoice (`factura`) or a complemento de pago, in the user's
 * words. `replaced`: a stamped CFDI replaces it, so "No cancelable" is expected and motive 01 goes
 * through. `rejectedBefore`: the client rejected an earlier request.
 */
export function cancellationPreviewNotice(
  preview: CancellationPreview,
  { subject, replaced, rejectedBefore }: { subject: 'factura' | 'complemento'; replaced: boolean; rejectedBefore: boolean },
): SatPreviewNotice {
  const it = subject === 'factura' ? 'la' : 'lo'
  if (preview.expired) {
    return {
      text: `Ya venció el plazo para cancelar${it}: el SAT lo permitía hasta el ${formatDayLong(preview.deadline)} de ${preview.deadline.slice(0, 4)}.`,
      tone: 'warn',
      blocks: true,
    }
  }
  switch (preview.cancellable) {
    case 'Cancelable sin aceptación':
      return { text: 'Se cancela sin que tu cliente tenga que aceptar.', tone: 'info' }
    case 'Cancelable con aceptación':
      return {
        text: rejectedBefore
          ? `Tu cliente tendrá que aceptar${it} en su buzón tributario. Como ya rechazó una solicitud, solo se cancela si ${it} acepta.`
          : `Tu cliente tendrá que aceptar${it} en su buzón tributario. Tiene 3 días hábiles; si no responde, el SAT ${it} cancela.`,
        tone: 'info',
      }
    case 'No cancelable':
      return replaced
        ? { text: `El SAT ${it} marca "No cancelable" porque ${subject === 'factura' ? 'la factura' : 'el complemento'} que ${it} sustituye ${it} relaciona; con el motivo 01 sí procede.`, tone: 'info' }
        : { text: `El SAT no permite cancelar${it}: tiene otros comprobantes relacionados vigentes. Cancela primero esos.`, tone: 'warn', blocks: true }
    default:
      return preview.error
        ? { text: 'No pudimos consultar al SAT. Puedes pedir la cancelación de todos modos.', tone: 'muted' }
        : { text: `El SAT aún no registra ${subject === 'factura' ? 'esta factura' : 'este complemento'}. Si ${it} acabas de timbrar, puede tardar unos minutos.`, tone: 'muted' }
  }
}

/** "Consultando al SAT…" while the answer arrives, then what it means for this request. */
export function SatPreviewLine({ loading, notice }: { loading: boolean; notice: SatPreviewNotice | null }) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-[13px] text-tinta-tenue">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Consultando al SAT…
      </p>
    )
  }
  if (!notice) return null

  return (
    <p
      className={cn(
        'rounded-[4px] px-3 py-2 text-[13px]',
        notice.tone === 'warn' && 'border border-ocre/40 bg-ocre-tenue text-tinta',
        notice.tone === 'info' && 'bg-sello-tenue text-tinta',
        notice.tone === 'muted' && 'px-0 py-0 text-tinta-tenue',
      )}
    >
      {notice.text}
    </p>
  )
}
