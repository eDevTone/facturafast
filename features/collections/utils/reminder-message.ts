import { formatClabe } from '@features/fiscal-profile/utils/clabe'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { formatDayLong } from '@features/payments/utils/payment-dates'

/** "Para que te paguen": the payment details of the issuing profile. */
export interface PaymentDetails {
  bankName: string | null
  clabe: string | null
  paymentLink: string | null
  /** The issuer's name, as the account holder. */
  holder: string
}

export interface ReminderMessageInput {
  /** "A-12" */
  invoiceLabel: string
  currency: string
  total: number
  /** Still owed; less than `total` once part of it was paid. */
  balance: number
  dueDate: string | null
  today: string
  payment: PaymentDetails | null
}

/** True when the profile has something the client can pay to. */
export function hasPaymentDetails(payment: PaymentDetails | null): payment is PaymentDetails {
  return !!payment && (!!payment.clabe || !!payment.paymentLink)
}

/** "Banco: …", "CLABE: …", "A nombre de: …", "En línea: …", as they go in the message. */
export function paymentDetailLines(payment: PaymentDetails | null): string[] {
  if (!hasPaymentDetails(payment)) return []
  const lines: string[] = []
  if (payment.clabe) {
    if (payment.bankName) lines.push(`Banco: ${payment.bankName}`)
    lines.push(`CLABE: ${formatClabe(payment.clabe)}`)
    lines.push(`A nombre de: ${payment.holder}`)
  }
  if (payment.paymentLink) lines.push(`${payment.clabe ? 'O en línea' : 'En línea'}: ${payment.paymentLink}`)
  return lines
}

/**
 * The reminder the user sends by WhatsApp or by email, and can edit before sending. Polite
 * ("usted"), since it usually goes to a company; it names the amount still owed and when it was
 * due, and ends with the details to pay.
 */
export function reminderMessage({ invoiceLabel, currency, total, balance, dueDate, today, payment }: ReminderMessageInput): string {
  const partial = balance < total
  const when = dueDate === null ? '' : `, que ${dueDate < today ? 'venció' : 'vence'} el ${formatDayLong(dueDate)}`
  const first = partial
    ? `Le escribo para recordarle el pago de la factura ${invoiceLabel}${when}. Queda un saldo de ${formatCurrency(balance, currency)} de ${formatCurrency(total, currency)}.`
    : `Le escribo para recordarle el pago de la factura ${invoiceLabel} por ${formatCurrency(total, currency)}${when}.`

  const lines = [`Hola, buen día. ${first}`]
  const details = paymentDetailLines(payment)
  if (details.length > 0) lines.push('', 'Datos para el pago:', ...details)
  lines.push('', 'Gracias.')
  return lines.join('\n')
}
