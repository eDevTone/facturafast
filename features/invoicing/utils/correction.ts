import { CORRECT_BLOCKED_BY_PAYMENTS } from '../constants/cancellation-reasons'

/**
 * Why an invoice cannot be corrected right now; null when it can. Correcting stamps an invoice that
 * replaces it and cancels it with motive 01, so it must be stamped, without complementos de pago,
 * without a pending cancellation and not replaced already.
 */
export function correctionBlockReason(
  invoice: { status: string; cancellationStatus: string | null; cancellationSubstituteUuid: string | null },
  options: { hasActivePayments: boolean; deadlineExpired?: boolean },
): string | null {
  if (invoice.status !== 'timbrada') return 'Solo se corrigen facturas timbradas.'
  if (options.hasActivePayments) return CORRECT_BLOCKED_BY_PAYMENTS
  if (invoice.cancellationStatus === 'en_proceso') return 'Ya pediste cancelarla. Espera la respuesta del SAT.'
  if (invoice.cancellationSubstituteUuid) return 'Ya la sustituiste con otra factura.'
  if (options.deadlineExpired) return 'Ya venció el plazo para cancelarla, así que tampoco se puede sustituir.'
  return null
}
