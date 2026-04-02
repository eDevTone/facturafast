const UNITS = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIUN', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO',
  'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
]

const TENS = [
  '', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA',
  'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA',
]

const HUNDREDS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
]

function groupToWords(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'
  if (n < 30) return UNITS[n]

  const h = Math.floor(n / 100)
  const remainder = n % 100

  let result = HUNDREDS[h]

  if (remainder === 0) return result
  if (h > 0) result += ' '

  if (remainder < 30) {
    result += UNITS[remainder]
  } else {
    const t = Math.floor(remainder / 10)
    const u = remainder % 10
    result += TENS[t]
    if (u > 0) result += ' Y ' + UNITS[u]
  }

  return result
}

/**
 * Convierte un número a su representación en texto en español
 * con formato estándar para facturas mexicanas.
 *
 * @example
 * numberToSpanishWords(300) // "TRESCIENTOS PESOS 00/100 M.N."
 * numberToSpanishWords(1250.50) // "MIL DOSCIENTOS CINCUENTA PESOS 50/100 M.N."
 */
export function numberToSpanishWords(amount: number): string {
  const integer = Math.floor(Math.abs(amount))
  const cents = Math.round((Math.abs(amount) - integer) * 100)

  if (integer === 0) {
    return `CERO PESOS ${cents.toString().padStart(2, '0')}/100 M.N.`
  }

  const millions = Math.floor(integer / 1_000_000)
  const thousands = Math.floor((integer % 1_000_000) / 1_000)
  const units = integer % 1_000

  let words = ''

  if (millions > 0) {
    if (millions === 1) {
      words += 'UN MILLON '
    } else {
      words += groupToWords(millions) + ' MILLONES '
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      words += 'MIL '
    } else {
      words += groupToWords(thousands) + ' MIL '
    }
  }

  if (units > 0) {
    words += groupToWords(units) + ' '
  }

  words = words.trimEnd()

  return `${words} PESOS ${cents.toString().padStart(2, '0')}/100 M.N.`
}
