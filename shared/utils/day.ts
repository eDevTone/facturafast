/**
 * Calendar days as YYYY-MM-DD strings (Mexico City dates, as `todayInMexico` returns them), so the
 * arithmetic never crosses a time zone.
 */

/** `day` plus `days` calendar days. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Last day of the month of `day`. */
export function endOfMonth(day: string): string {
  const [year, month] = day.split('-').map(Number)
  // Day 0 of the next month is the last day of this one (months are 0-based in Date.UTC).
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

/** Calendar days from `from` to `to`; negative when `to` comes first. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000)
}

/** YYYY-MM of a day. */
export function monthOf(day: string): string {
  return day.slice(0, 7)
}

/** `month` (YYYY-MM) plus `months`, which may be negative. */
export function addMonths(month: string, months: number): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const index = year * 12 + (monthNumber - 1) + months
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}
