const TIMEZONE = 'America/Mexico_City'
const LOCALE = 'es-MX'

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TIMEZONE,
    ...options,
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(LOCALE, {
    timeZone: TIMEZONE,
  })
}

export function formatDateShort(date: Date | string): string {
  return formatDate(date, { day: '2-digit', month: 'short', year: '2-digit' })
}

export function formatDateLong(date: Date | string): string {
  return formatDate(date, { day: 'numeric', month: 'long', year: 'numeric' })
}
