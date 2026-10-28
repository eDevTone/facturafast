import { addMonths, endOfMonth, monthOf } from '@shared/utils/day'

export { addMonths, monthOf }

/**
 * When a recurring invoice runs. Days are Mexico City YYYY-MM-DD strings and months YYYY-MM, as
 * `todayInMexico` gives them; nothing here crosses a time zone.
 */

/** "Último día" is stored as 31: a shorter month runs on its last day. */
export const LAST_DAY = 31

/** The days a user can pick: 1 to 28 exist in every month, then "Último día". */
export const DAY_OPTIONS = [...Array.from({ length: 28 }, (_, i) => i + 1), LAST_DAY]

/** The day it runs in a month: its day of the month, or the last day when the month is shorter. */
export function runDayIn(month: string, dayOfMonth: number): string {
  const lastDay = Number(endOfMonth(`${month}-01`).slice(8))
  return `${month}-${String(Math.min(dayOfMonth, lastDay)).padStart(2, '0')}`
}

/**
 * The next day it runs. A month that already has its invoice (`lastRunOn` in it) is skipped;
 * otherwise this month's day still counts while it has not passed.
 */
export function nextRunOn(dayOfMonth: number, today: string, lastRunOn: string | null): string {
  const month = monthOf(today)
  if (lastRunOn && monthOf(lastRunOn) >= month) return runDayIn(addMonths(monthOf(lastRunOn), 1), dayOfMonth)
  const thisMonth = runDayIn(month, dayOfMonth)
  return thisMonth >= today ? thisMonth : runDayIn(addMonths(month, 1), dayOfMonth)
}

/** "el día 15" / "el último día" */
export function dayOfMonthLabel(dayOfMonth: number): string {
  return dayOfMonth === LAST_DAY ? 'el último día' : `el día ${dayOfMonth}`
}
