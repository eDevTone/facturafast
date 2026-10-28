/**
 * Banxico SIE API. The exchange rate the CFF (art. 20) asks for on a day D — the one Banxico
 * published in the DOF on the previous banking day — is series SF60653 ("para solventar
 * obligaciones", by settlement date) on D. SF43718 is the FIX by determination date, a day earlier.
 */

/** Series per currency: only the US dollar has a daily DOF rate. */
export const BANXICO_SERIES: Record<string, string> = { USD: 'SF60653' }

export const BANXICO_API = 'https://www.banxico.org.mx/SieAPIRest/service/v1/series'

/** "19/10/2026" → "2026-10-19" */
function isoDay(banxicoDate: string): string {
  const [day, month, year] = banxicoDate.split('/')
  return `${year}-${month}-${day}`
}

/**
 * Values of a series from a `/datos/{start}/{end}` response, by ISO day. Days without a value come
 * as "N/E" and are left out.
 */
export function parseBanxicoSeries(body: unknown): Record<string, number> {
  const series = (body as { bmx?: { series?: { datos?: { fecha: string; dato: string }[] }[] } })?.bmx?.series?.[0]
  const values: Record<string, number> = {}
  for (const { fecha, dato } of series?.datos ?? []) {
    const value = Number(dato.replace(/,/g, ''))
    if (dato !== 'N/E' && Number.isFinite(value) && value > 0) values[isoDay(fecha)] = value
  }
  return values
}

export { addDays } from '@shared/utils/day'
