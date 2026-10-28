/** c_MotivoCancelacion. */
export type CancellationReason = '01' | '02' | '03' | '04'

/** The SAT motives in the user's words; `satLabel` is the catalog text. */
export const CANCELLATION_REASONS: { value: CancellationReason; label: string; satLabel: string }[] = [
  { value: '01', label: 'Tiene errores y ya la sustituí', satLabel: 'Comprobante emitido con errores con relación' },
  { value: '02', label: 'Tiene errores y no la voy a sustituir', satLabel: 'Comprobante emitido con errores sin relación' },
  { value: '03', label: 'La operación no se llevó a cabo', satLabel: 'No se llevó a cabo la operación' },
  { value: '04', label: 'La operación va en una factura global', satLabel: 'Operación nominativa relacionada en una factura global' },
]

/** Why an invoice with complementos de pago vigentes cannot be corrected: its replacement cancels it. */
export const CORRECT_BLOCKED_BY_PAYMENTS =
  'Esta factura tiene complementos de pago vigentes. Para corregirla, primero cancélalos desde Cobros, del último al primero.'

/** Why an invoice with complementos de pago vigentes cannot be cancelled (RMF 2026, regla 2.7.1.34). */
export const CANCEL_BLOCKED_BY_PAYMENTS =
  'Esta factura tiene complementos de pago vigentes. El SAT pide cancelarlos antes que la factura: hazlo desde Cobros, del último al primero.'
