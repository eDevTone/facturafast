import { formatDateLong } from '@shared/utils/date'

/** How many days ahead of its expiry a CSD shows as about to expire, in Inicio and in the profile card. */
export const CSD_WARNING_DAYS = 30

/** Days left on which the daily cron emails the user about a CSD about to expire. */
export const CSD_REMINDER_DAYS: readonly number[] = [30, 7, 1]

/** The SAT's page for requesting a new CSD (trámite 17507). */
export const CSD_REQUEST_URL =
  'https://www.sat.gob.mx/tramites/17507/envia-la-solicitud-para-tu-certificado-de-sello-digital-para-emitir-facturas-electronicas'

export type CsdExpiry =
  | { state: 'vigente' }
  /** `lastDay` is the Mexico City day (YYYY-MM-DD) the CSD stops working; `daysLeft` is 0 on that day. */
  | { state: 'por_vencer'; lastDay: string; daysLeft: number }
  | { state: 'vencido'; lastDay: string }

const MEXICO_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** The Mexico City day (YYYY-MM-DD) of an instant. Safe in client components, unlike the CFDI date helpers. */
function mexicoDay(instant: Date): string {
  return MEXICO_DAY.format(instant)
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

/**
 * Where a CSD stands at `now`. `validUntil` is the certificate's notAfter (ISO, as stored in
 * `cert_valid_until`): the CSD seals until that instant, so the Mexico City day it falls on is its last day.
 */
export function csdExpiry(validUntil: string | null | undefined, now: Date = new Date()): CsdExpiry {
  if (!validUntil) return { state: 'vigente' }

  const end = new Date(validUntil)
  const lastDay = mexicoDay(end)
  if (end.getTime() <= now.getTime()) return { state: 'vencido', lastDay }

  const daysLeft = daysBetween(mexicoDay(now), lastDay)
  return daysLeft <= CSD_WARNING_DAYS ? { state: 'por_vencer', lastDay, daysLeft } : { state: 'vigente' }
}

/** "vence hoy", "vence mañana", "vence en 12 días". */
export function csdDaysLeftLabel(daysLeft: number): string {
  if (daysLeft <= 0) return 'vence hoy'
  if (daysLeft === 1) return 'vence mañana'
  return `vence en ${daysLeft} días`
}

/** Why an expired CSD stops a stamping, and what to do. */
export function csdExpiredMessage(validUntil: string): string {
  return `Tu CSD venció el ${formatDateLong(validUntil)}. Tramita uno nuevo en el SAT y súbelo en Perfiles fiscales para seguir timbrando.`
}
