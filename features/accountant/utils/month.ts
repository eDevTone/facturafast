import { addMonths, monthOf } from '@shared/utils/day'

/**
 * The instants a Mexico City month covers, [from, to). Mexico City is UTC−6 all year since 2022,
 * so an invoice stamped on 31 October at 23:30 belongs to October although in UTC it is 1 November.
 */
export function monthRange(month: string): { from: Date; to: Date } {
  return {
    from: new Date(`${month}-01T06:00:00Z`),
    to: new Date(`${addMonths(month, 1)}-01T06:00:00Z`),
  }
}

/** The last `count` months up to the month of `today`, newest first. */
export function recentMonths(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addMonths(monthOf(today), -index))
}

/** Every month from `first` to `last`, newest first. */
export function monthsBetween(first: string, last: string): string[] {
  const months: string[] = []
  for (let month = last; month >= first; month = addMonths(month, -1)) months.push(month)
  return months
}

/** "Octubre de 2026" */
export function monthLabel(month: string): string {
  const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-15T12:00:00Z`),
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}
