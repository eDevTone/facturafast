import { formatDate } from '@shared/utils/date'

/**
 * A YYYY-MM-DD day as noon in Mexico City (UTC−6 all year since 2022), so formatting it in any
 * time zone near Mexico keeps the same calendar day.
 */
function middayInMexico(day: string): Date {
  return new Date(`${day}T18:00:00Z`)
}

/** "19 oct 2026" */
export function formatDay(day: string): string {
  return formatDate(middayInMexico(day), { day: 'numeric', month: 'short', year: 'numeric' })
}

/** "5 de noviembre" */
export function formatDayLong(day: string): string {
  return formatDate(middayInMexico(day), { day: 'numeric', month: 'long' })
}

/**
 * Last day to issue the complemento de pago of a payment: the 5th of the following month
 * (RMF 2026, regla 2.7.1.32).
 */
export function paymentComplementDeadline(paidOn: string): string {
  const [year, month] = paidOn.split('-').map(Number)
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
  return `${next.year}-${String(next.month).padStart(2, '0')}-05`
}
