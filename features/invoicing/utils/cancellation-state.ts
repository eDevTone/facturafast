import type { Invoice } from '../types/invoice.types'

/** Where an invoice stands with the SAT, including a cancellation it has not resolved yet. */
export type InvoiceStampState =
  | 'draft'
  | 'timbrada'
  /** A stamped correction replaces it, but its cancellation was not received yet. */
  | 'por_cancelar'
  | 'en_cancelacion'
  /** The client rejected the cancellation (or ignored a second request): it is still valid. */
  | 'cancelacion_rechazada'
  | 'cancelada'

export function invoiceStampState(
  invoice: Pick<Invoice, 'status' | 'cancellationStatus' | 'cancellationSubstituteUuid'>,
): InvoiceStampState {
  if (invoice.status === 'draft') return 'draft'
  if (invoice.status === 'cancelada') return 'cancelada'
  if (invoice.cancellationStatus === 'en_proceso') return 'en_cancelacion'
  if (invoice.cancellationStatus === 'rechazada') return 'cancelacion_rechazada'
  if (invoice.cancellationSubstituteUuid) return 'por_cancelar'
  return 'timbrada'
}

/** How the SAT says a cancelled invoice was cancelled, in the user's words. */
export function cancelledHow(satCancellationStatus: string | null): string | null {
  switch (satCancellationStatus) {
    case 'Cancelado sin aceptación':
      return 'Sin aceptación'
    case 'Cancelado con aceptación':
      return 'Aceptada por tu cliente'
    case 'Plazo vencido':
      return 'Por plazo vencido'
    default:
      return null
  }
}
