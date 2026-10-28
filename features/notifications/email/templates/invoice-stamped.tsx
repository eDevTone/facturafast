import { Column, Preview, Row, Section, Text } from '@react-email/components'
import { EmailFooter } from '../components/email-footer'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'
import { amountWithCurrency, EmailPaymentDetails } from '../components/email-payment-details'

interface InvoiceStampedEmailProps {
  clientName: string
  businessName: string
  folioLabel: string
  /** Formatted in the invoice currency: "$1,000.00" or "USD 1,000.00". */
  total: string
  currency: string
  uuid: string
  stampedAt: string
  /** "19 nov 2026" when the invoice has days of credit and is still owed. */
  dueDate?: string | null
  /** The issuer's payment details, only when the invoice is still owed. */
  paymentDetails?: string[]
}

export function InvoiceStampedEmail({
  clientName,
  businessName,
  folioLabel,
  total,
  currency,
  uuid,
  stampedAt,
  dueDate,
  paymentDetails = [],
}: InvoiceStampedEmailProps) {
  const amount = amountWithCurrency(total, currency)
  return (
    <EmailLayout preview={`Factura ${folioLabel} — ${amount}`}>
      <Preview>Factura {folioLabel} — {amount}</Preview>

      {/* Card container */}
      <Section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '32px',
        }}
      >
        <EmailHeader />

        {/* Greeting */}
        <Text
          style={{
            fontSize: '15px',
            lineHeight: '24px',
            color: '#141414',
            margin: '0 0 16px 0',
          }}
        >
          Hola {clientName},
        </Text>

        <Text
          style={{
            fontSize: '15px',
            lineHeight: '24px',
            color: '#141414',
            margin: '0 0 24px 0',
          }}
        >
          Se ha emitido la factura <strong>{folioLabel}</strong> por{' '}
          <strong>{amount}</strong>.
        </Text>

        {/* Invoice summary card */}
        <Section
          style={{
            backgroundColor: '#f5f5f7',
            borderRadius: '4px',
            padding: '20px',
            margin: '0 0 24px 0',
          }}
        >
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' }}>
                Folio
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '14px', color: '#141414', margin: '0', fontWeight: '600', fontFamily: '"IBM Plex Mono", Menlo, monospace' }}>
                {folioLabel}
              </Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' }}>
                Total
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '14px', color: '#2f4ba8', margin: '0', fontWeight: '700', fontFamily: '"IBM Plex Mono", Menlo, monospace' }}>
                {amount}
              </Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' }}>
                UUID
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '11px', color: '#141414', margin: '0', fontFamily: '"IBM Plex Mono", Menlo, monospace' }}>
                {uuid}
              </Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' }}>
                Fecha
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '13px', color: '#141414', margin: '0' }}>
                {stampedAt}
              </Text>
            </Column>
          </Row>
          {dueDate && (
            <Row style={{ padding: '4px 0' }}>
              <Column>
                <Text style={{ fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' }}>
                  Vence
                </Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: '13px', color: '#141414', margin: '0' }}>
                  {dueDate}
                </Text>
              </Column>
            </Row>
          )}
        </Section>

        <EmailPaymentDetails lines={paymentDetails} />

        {/* Attachments note */}
        <Text
          style={{
            fontSize: '14px',
            lineHeight: '22px',
            color: '#5e5e66',
            margin: '0 0 8px 0',
          }}
        >
          Adjunto encontrarás:
        </Text>
        <Text
          style={{
            fontSize: '14px',
            lineHeight: '22px',
            color: '#5e5e66',
            margin: '0 0 24px 0',
          }}
        >
          • <strong>XML (CFDI)</strong> — Comprobante fiscal digital
          <br />
          • <strong>PDF</strong> — Representación impresa
        </Text>

        <EmailFooter businessName={businessName} />
      </Section>
    </EmailLayout>
  )
}

export default InvoiceStampedEmail
