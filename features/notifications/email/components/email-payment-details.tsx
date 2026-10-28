import { Section, Text } from '@react-email/components'

/**
 * "Datos para el pago": the lines of the issuer's payment details (bank, CLABE, holder, link),
 * as `paymentDetailLines` writes them. Nothing when there are none.
 */
export function EmailPaymentDetails({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <Section style={{ border: '1px solid #e5e5ea', borderRadius: '4px', padding: '16px 20px', margin: '0 0 24px 0' }}>
      <Text style={{ fontSize: '12px', color: '#5e5e66', margin: '0 0 6px 0', fontWeight: '600' }}>Datos para el pago</Text>
      {lines.map((line) => (
        <Text key={line} style={{ fontSize: '13px', lineHeight: '20px', color: '#141414', margin: '0' }}>
          {line}
        </Text>
      ))}
    </Section>
  )
}

/** "$1,000.00 MXN" in pesos; an amount in another currency already starts with its code ("USD 1,000.00"). */
export function amountWithCurrency(amount: string, currency: string): string {
  return currency === 'MXN' ? `${amount} MXN` : amount
}
