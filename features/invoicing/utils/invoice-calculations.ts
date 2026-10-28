/**
 * Format currency (MXN)
 * Amounts are computed in `cfdi-amounts.ts`; this file only formats them.
 */
/** "$1,000.00" in pesos; "USD 1,000.00" in another currency. */
export function formatCurrency(amount: number | string, currency = 'MXN') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(num)
}
