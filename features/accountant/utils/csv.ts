export type CsvValue = string | number | null | undefined

/**
 * A CSV cell. Numbers go with two decimals. Text is quoted when it carries a comma, a quote or a
 * line break, and text that starts like a formula (= + - @) gets a leading apostrophe: a client's
 * name is typed by people, and Excel would run it.
 */
export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return value.toFixed(2)
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** CSV text with a BOM, so Excel reads the accents; lines end in CRLF. */
export function toCsv(rows: CsvValue[][]): string {
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
