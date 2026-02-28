import type { CreateInvoiceItemInput } from '../types/invoice.types'

/**
 * Calculate invoice totals (subtotal, IVA 16%, total)
 */
export function calculateInvoiceTotals(items: CreateInvoiceItemInput[]) {
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.cantidad * item.valorUnitario)
  }, 0)
  
  const iva = subtotal * 0.16 // 16% IVA
  const total = subtotal + iva
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    total: Number(total.toFixed(2))
  }
}

/**
 * Calculate single item importe
 */
export function calculateItemImporte(cantidad: number, valorUnitario: number) {
  return Number((cantidad * valorUnitario).toFixed(2))
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
