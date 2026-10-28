import { cn } from '@/lib/utils'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import type { CollectionState } from '../utils/collection-state'

/**
 * The line under an invoice total in the lists: "Por cobrar", "Saldo $X", "Vencida" in red ink,
 * or "Pagada" once a PPD invoice is collected. A paid PUE invoice says nothing: that is the norm.
 */
export function CollectionLabel({
  state,
  paymentMethod,
  currency,
  className,
}: {
  state: CollectionState | null
  paymentMethod: string
  currency: string
  className?: string
}) {
  if (!state || (state.status === 'cobrada' && paymentMethod !== 'PPD')) return null

  const balance = <span className="font-mono">{formatCurrency(state.balance, currency)}</span>
  const content =
    state.status === 'cobrada' ? 'Pagada'
      : state.status === 'vencida' ? state.paid > 0 ? <>Vencida · saldo {balance}</> : 'Vencida'
        : state.status === 'parcial' ? <>Saldo {balance}</>
          : 'Por cobrar'

  return (
    <p
      className={cn(
        'text-[12px]',
        state.status === 'cobrada' ? 'text-sello' : state.status === 'vencida' ? 'text-tinta-roja' : 'text-tinta-tenue',
        className,
      )}
    >
      {content}
    </p>
  )
}

/** Mini stamp next to the invoice status while something is owed. */
export function CollectionBadge({ state }: { state: CollectionState | null }) {
  if (!state || state.status === 'cobrada') return null
  const { label, tone } =
    state.status === 'vencida' ? { label: 'Vencida', tone: 'text-tinta-roja' }
      : state.status === 'parcial' ? { label: 'Cobro parcial', tone: 'border-dashed text-ocre' }
        : { label: 'Por cobrar', tone: 'border-dashed text-ocre' }
  return <span className={cn('sello-mini', tone)}>{label}</span>
}
