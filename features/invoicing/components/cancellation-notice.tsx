'use client'

import { Button } from '@shared/ui/button'
import { formatDate, formatDateLong } from '@shared/utils/date'
import { Loader2, RotateCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { refreshCancellationStatusAction } from '../actions/refresh-cancellation-status.action'
import type { Invoice, RelatedInvoice } from '../types/invoice.types'
import { invoiceStampState } from '../utils/cancellation-state'

interface CancellationNoticeProps {
  invoice: Pick<
    Invoice,
    | 'id'
    | 'status'
    | 'cancellationStatus'
    | 'cancellationSubstituteUuid'
    | 'cancellationReason'
    | 'cancellationRequestedAt'
    | 'satCancellable'
    | 'satCancellationStatus'
    | 'satCheckedAt'
  >
  /** The invoice that replaces this one, when there is one. */
  replacedBy?: RelatedInvoice
  /** Opens the cancel dialog to ask (again) for the cancellation. */
  onRequest: () => void
}

function RelatedLabel({ related }: { related?: RelatedInvoice }) {
  if (!related) return <>otra factura</>
  if (!related.id) return <span className="font-mono">{related.uuid}</span>
  return (
    <Link href={`/invoices/${related.id}`} className="font-medium underline underline-offset-2">
      {related.label}
    </Link>
  )
}

/**
 * Above the sheet, while a cancellation is not resolved: what the SAT said, what happens next and
 * the one action that moves it forward.
 */
export function CancellationNotice({ invoice, replacedBy, onRequest }: CancellationNoticeProps) {
  const router = useRouter()
  const [isRefreshing, startRefreshing] = useTransition()
  const state = invoiceStampState(invoice)

  const handleRefresh = () => {
    startRefreshing(async () => {
      const result = await refreshCancellationStatusAction(invoice.id)
      if (!result.success) {
        toast.error('No pudimos consultar al SAT', { description: 'Intenta en unos minutos.' })
        return
      }
      if (result.decision === 'cancelled') toast.success('El SAT ya la canceló')
      else if (result.decision === 'rejected') toast.warning('Tu cliente no aceptó la cancelación')
      else toast('Sigue en proceso', { description: 'El SAT aún no tiene respuesta de tu cliente.' })
      router.refresh()
    })
  }

  if (state === 'en_cancelacion') {
    const withAcceptance = invoice.satCancellable === 'Cancelable con aceptación'
    return (
      <Notice title="Cancelación en proceso">
        <p>
          Pediste cancelarla
          {invoice.cancellationRequestedAt && <> el {formatDateLong(invoice.cancellationRequestedAt)}</>}
          {invoice.cancellationReason && <> con el motivo <span className="font-mono">{invoice.cancellationReason}</span></>}.{' '}
          {withAcceptance
            ? 'Tu cliente tiene 3 días hábiles para aceptarla o rechazarla en su buzón tributario; si no responde a la primera solicitud, el SAT la cancela.'
            : 'El SAT está procesando la cancelación.'}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="animate-spin" /> : <RotateCw />}
            Actualizar estatus
          </Button>
          {invoice.satCheckedAt && (
            <span className="text-[12px] text-tinta-tenue">
              Última consulta al SAT: {formatDate(invoice.satCheckedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
        </div>
      </Notice>
    )
  }

  if (state === 'por_cancelar') {
    return (
      <Notice title="Falta cancelarla">
        <p>
          La sustituiste con la <RelatedLabel related={replacedBy} />, pero el SAT aún no recibe su cancelación. Si acabas
          de timbrar la nueva, el SAT puede tardar unos minutos en registrarla.
        </p>
        <div>
          <Button size="sm" onClick={onRequest}>
            Pedir cancelación
          </Button>
        </div>
      </Notice>
    )
  }

  if (state === 'cancelacion_rechazada') {
    const expired = invoice.satCancellationStatus === 'Plazo vencido'
    return (
      <Notice title={expired ? 'Tu cliente no respondió' : 'Tu cliente rechazó la cancelación'}>
        <p>
          {expired
            ? 'Como ya había rechazado una solicitud, el SAT no la cancela sin su respuesta. '
            : ''}
          La factura sigue vigente
          {invoice.cancellationSubstituteUuid && <>, igual que la <RelatedLabel related={replacedBy} /> que la sustituye</>}.
          Habla con tu cliente y vuelve a pedirla; solo se cancela si la acepta.
        </p>
        <div>
          <Button size="sm" onClick={onRequest}>
            Volver a pedirla
          </Button>
        </div>
      </Notice>
    )
  }

  return null
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-[4px] border border-ocre/40 bg-ocre-tenue px-4 py-3 text-[13px] text-tinta" aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}
