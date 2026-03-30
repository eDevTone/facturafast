import type { CreateInvoiceItemInput } from '../types/invoice.types'

const IVA_RATE = 0.16
const IVA_DIVISOR = 1 + IVA_RATE // 1.16

/**
 * Calculate invoice totals from IVA-included prices.
 * Unit prices entered by the user already include IVA.
 * total = sum(qty * unitPrice)
 * subtotal = total / 1.16
 * iva = total - subtotal
 */
export function calculateInvoiceTotals(items: CreateInvoiceItemInput[]) {
  const total = items.reduce((acc, item) => {
    return acc + (item.quantity * item.unitPrice)
  }, 0)

  const subtotal = total / IVA_DIVISOR
  const iva = total - subtotal

  return {
    subtotal: Number(subtotal.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}

/**
 * Calculate single item amount (IVA included)
 */
export function calculateItemAmount(quantity: number, unitPrice: number) {
  return Number((quantity * unitPrice).toFixed(2))
}

/**
 * Format currency (MXN)
 */
export function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(num)
}
