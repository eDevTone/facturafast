import { addDays, daysBetween } from '@shared/utils/day'

/** Most days of credit a client or an invoice can have. */
export const MAX_PAYMENT_TERMS_DAYS = 365

/** Day the payment is due: the stamping day plus the days of credit; null without a term. */
export function dueDateFor(stampDay: string, paymentTermsDays: number | null): string | null {
  return paymentTermsDays === null ? null : addDays(stampDay, paymentTermsDays)
}

/**
 * A PUE invoice with days of credit is not paid when stamped: it starts awaiting payment.
 * Without days of credit it was paid at once (RMF 2026, regla 2.7.1.39).
 */
export function startsAwaitingPayment(paymentMethod: string, paymentTermsDays: number | null): boolean {
  return paymentMethod === 'PUE' && (paymentTermsDays ?? 0) > 0
}

/** "Venció hace 3 días", "Vence hoy", "Vence en 5 días": how far the due date is from today. */
export function dueLabel(dueDate: string, today: string): string {
  const days = daysBetween(today, dueDate)
  if (days < -1) return `Venció hace ${-days} días`
  if (days === -1) return 'Venció ayer'
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  return `Vence en ${days} días`
}
