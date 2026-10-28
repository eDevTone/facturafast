import { cn } from '@/lib/utils'
import type { Invoice } from '../types/invoice.types'
import { invoiceStampState, type InvoiceStampState } from '../utils/cancellation-state'

const config: Record<InvoiceStampState, { label: string; className: string }> = {
  draft: {
    label: 'Borrador',
    // Pencil: dashed, quiet ink
    className: 'border-dashed text-tinta-tenue',
  },
  timbrada: {
    label: 'Timbrada',
    className: 'text-sello',
  },
  // Pending with the SAT: ochre, dashed while the SAT works on it
  por_cancelar: {
    label: 'Por cancelar',
    className: 'text-ocre',
  },
  en_cancelacion: {
    label: 'En cancelación',
    className: 'border-dashed text-ocre',
  },
  cancelacion_rechazada: {
    label: 'Cancelación rechazada',
    className: 'text-ocre',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'text-tinta-roja',
  },
}

interface StatusBadgeProps {
  invoice: Pick<Invoice, 'status' | 'cancellationStatus' | 'cancellationSubstituteUuid'>
  className?: string
}

/**
 * Small status stamp for lists and headers: stamp ink for timbrada, red for cancelada, pencil for
 * borrador, and ochre while a cancellation is pending with the SAT.
 */
export function StatusBadge({ invoice, className }: StatusBadgeProps) {
  const { label, className: tone } = config[invoiceStampState(invoice)]

  return <span className={cn('sello-mini', tone, className)}>{label}</span>
}
