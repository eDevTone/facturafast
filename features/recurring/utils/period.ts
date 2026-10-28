import { addMonths } from './schedule'

/**
 * The month written in a recurring invoice's descriptions ("Diseño de redes — octubre 2026") is
 * kept as tokens, `{mes} {año}`, and filled each month with the month that invoice is for.
 */

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** A month name, and the year right after it ("octubre 2026", "Octubre de 2026"), if any. */
const MONTH_PATTERN = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b(?:(\s+(?:de\s+|del\s+)?)(\d{4})\b)?/gi

/** Month offsets a user can pick: the month before, the same month, the month after. */
export const PERIOD_OFFSETS = [-1, 0, 1] as const

function monthIndex(name: string): number {
  const lower = name.toLowerCase()
  return lower === 'setiembre' ? 8 : MONTHS.indexOf(lower)
}

/** The case of the month as written: `{MES}`, `{Mes}` or `{mes}`. */
function monthToken(name: string): string {
  if (name === name.toUpperCase()) return '{MES}'
  return name[0] === name[0].toUpperCase() ? '{Mes}' : '{mes}'
}

/**
 * Swaps the month written in a description for tokens. Only a description that names one month
 * is changed: "enero a marzo" is a range and is left as written.
 */
export function tokenizePeriod(text: string): { text: string; month: number | null } {
  const matches = [...text.matchAll(MONTH_PATTERN)]
  if (matches.length !== 1) return { text, month: null }
  const [match] = matches
  const [whole, name, separator, year] = match
  const replacement = monthToken(name) + (year ? `${separator}{año}` : '')
  const start = match.index ?? 0
  return { text: text.slice(0, start) + replacement + text.slice(start + whole.length), month: monthIndex(name) }
}

/** Whether a description carries period tokens. */
export function hasPeriodTokens(text: string): boolean {
  return /\{(mes|Mes|MES|año)\}/.test(text)
}

/** Fills the tokens with a month, YYYY-MM. */
export function fillPeriod(text: string, period: string): string {
  const [year, month] = period.split('-').map(Number)
  const name = MONTHS[month - 1]
  return text
    .replaceAll('{mes}', name)
    .replaceAll('{Mes}', name[0].toUpperCase() + name.slice(1))
    .replaceAll('{MES}', name.toUpperCase())
    .replaceAll('{año}', String(year))
}

/** The month a run names: the month it runs in, moved by the offset. */
export function periodFor(runMonth: string, offset: number): string {
  return addMonths(runMonth, offset)
}

/**
 * Tokenizes the descriptions of an invoice and finds which month they name, relative to the
 * month the invoice was issued in: the same (0), the one before (−1) or the one after (1).
 */
export function tokenizeDescriptions(descriptions: string[], issueMonth: string): {
  descriptions: string[]
  periodOffset: number
  detected: boolean
} {
  const issued = Number(issueMonth.slice(5, 7)) - 1
  let offset: number | null = null
  const tokenized = descriptions.map((description) => {
    const result = tokenizePeriod(description)
    if (result.month !== null && offset === null) {
      const diff = (result.month - issued + 12) % 12
      offset = diff === 11 ? -1 : diff === 1 ? 1 : 0
    }
    return result.text
  })
  return { descriptions: tokenized, periodOffset: offset ?? 0, detected: offset !== null }
}
