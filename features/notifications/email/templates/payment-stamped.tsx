import { Column, Preview, Row, Section, Text } from '@react-email/components'
import { EmailFooter } from '../components/email-footer'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'
import { amountWithCurrency } from '../components/email-payment-details'

interface PaymentStampedEmailProps {
  clientName: string
  businessName: string
  /** Serie-folio of the complemento, e.g. "P-12". */
  folioLabel: string
  /** Serie-folio of the invoice it pays. */
  invoiceLabel: string
  installment: string
  /** Formatted in the payment currency: "$1,000.00" or "USD 1,000.00". */
  amount: string
  /** MonedaP. */
  currency: string
  /** What is still owed on the invoice; "$0.00" when it is paid off. */
  remainingBalance: string
  isPaidOff: boolean
  paidOn: string
  uuid: string
}

const labelStyle = { fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' } as const
const valueStyle = { fontSize: '13px', color: '#141414', margin: '0' } as const
const monoStyle = { ...valueStyle, fontFamily: '"IBM Plex Mono", Menlo, monospace' } as const

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Row style={{ padding: '4px 0' }}>
      <Column>
        <Text style={labelStyle}>{label}</Text>
      </Column>
      <Column style={{ textAlign: 'right' }}>{children}</Column>
    </Row>
  )
}

/** Sent to the client when a payment is recorded: the complemento de pago with its XML and PDF. */
export function PaymentStampedEmail({
  clientName,
  businessName,
  folioLabel,
  invoiceLabel,
  installment,
  amount,
  currency,
  remainingBalance,
  isPaidOff,
  paidOn,
  uuid,
}: PaymentStampedEmailProps) {
  return (
    <EmailLayout preview={`Complemento de pago ${folioLabel} — ${amountWithCurrency(amount, currency)}`}>
      <Preview>Complemento de pago {folioLabel} — {amountWithCurrency(amount, currency)}</Preview>

      <Section style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '32px' }}>
        <EmailHeader />

        <Text style={{ fontSize: '15px', lineHeight: '24px', color: '#141414', margin: '0 0 16px 0' }}>
          Hola {clientName},
        </Text>

        <Text style={{ fontSize: '15px', lineHeight: '24px', color: '#141414', margin: '0 0 24px 0' }}>
          {businessName} registró tu pago de <strong>{amountWithCurrency(amount, currency)}</strong> a la factura <strong>{invoiceLabel}</strong> y
          emitió su complemento de pago.
        </Text>

        <Section style={{ backgroundColor: '#f5f5f7', borderRadius: '4px', padding: '20px', margin: '0 0 24px 0' }}>
          <SummaryRow label="Complemento">
            <Text style={{ ...monoStyle, fontSize: '14px', fontWeight: '600' }}>{folioLabel}</Text>
          </SummaryRow>
          <SummaryRow label="Factura pagada">
            <Text style={monoStyle}>
              {invoiceLabel} · parcialidad {installment}
            </Text>
          </SummaryRow>
          <SummaryRow label="Monto pagado">
            <Text style={{ ...monoStyle, fontSize: '14px', color: '#2f4ba8', fontWeight: '700' }}>{amountWithCurrency(amount, currency)}</Text>
          </SummaryRow>
          <SummaryRow label={isPaidOff ? 'Saldo' : 'Saldo pendiente'}>
            <Text style={monoStyle}>{isPaidOff ? 'Factura pagada' : amountWithCurrency(remainingBalance, currency)}</Text>
          </SummaryRow>
          <SummaryRow label="Fecha de pago">
            <Text style={valueStyle}>{paidOn}</Text>
          </SummaryRow>
          <SummaryRow label="UUID">
            <Text style={{ ...monoStyle, fontSize: '11px' }}>{uuid}</Text>
          </SummaryRow>
        </Section>

        <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#5e5e66', margin: '0 0 8px 0' }}>
          Adjunto encontrarás:
        </Text>
        <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#5e5e66', margin: '0 0 24px 0' }}>
          • <strong>XML (CFDI)</strong> — Complemento de pago
          <br />
          • <strong>PDF</strong> — Representación impresa
        </Text>

        <EmailFooter businessName={businessName} />
      </Section>
    </EmailLayout>
  )
}

export default PaymentStampedEmail
