import { db } from '@database/client'
import { exchangeRates } from '@database/schemas/exchange-rates.schema'
import { and, eq } from 'drizzle-orm'
import { addDays, BANXICO_API, BANXICO_SERIES, parseBanxicoSeries } from '../utils/banxico'

const TIMEOUT_MS = 8_000

/** Whether the app can ask Banxico (the token is free: banxico.org.mx/SieAPIRest/service/v1/token). */
export function hasBanxicoToken(): boolean {
  return !!process.env.BANXICO_TOKEN
}

/**
 * The exchange rate of the CFF (art. 20) for a currency on a day: Banxico's rate published in the
 * DOF on the previous banking day. Reads the cache; when the day is missing, asks Banxico for the
 * week around it and keeps every value. Null without a token, for a currency Banxico does not
 * publish daily, or when Banxico does not answer: then the user types the rate.
 */
export async function getDofRate(currency: string, day: string): Promise<number | null> {
  const series = BANXICO_SERIES[currency]
  if (!series) return null

  const [cached] = await db
    .select({ rate: exchangeRates.rate })
    .from(exchangeRates)
    .where(and(eq(exchangeRates.currency, currency), eq(exchangeRates.day, day)))
    .limit(1)
  if (cached) return Number(cached.rate)

  const token = process.env.BANXICO_TOKEN
  if (!token) return null

  try {
    const response = await fetch(`${BANXICO_API}/${series}/datos/${addDays(day, -7)}/${addDays(day, 2)}`, {
      headers: { 'Bmx-Token': token, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!response.ok) {
      console.error('[banxico] HTTP', response.status)
      return null
    }
    const values = parseBanxicoSeries(await response.json())
    const rows = Object.entries(values).map(([valueDay, rate]) => ({ currency, day: valueDay, rate: rate.toFixed(6) }))
    if (rows.length > 0) await db.insert(exchangeRates).values(rows).onConflictDoNothing()
    return values[day] ?? null
  } catch (error) {
    console.error('[banxico] Request failed:', error instanceof Error ? error.message : error)
    return null
  }
}
