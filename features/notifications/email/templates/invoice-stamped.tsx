import { Column, Preview, Row, Section, Text } from '@react-email/components'
import { EmailFooter } from '../components/email-footer'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'

interface InvoiceStampedEmailProps {
  clientName: string
  businessName: string
  folioLabel: string
  total: string
  currency: string
  uuid: string
  stampedAt: string
}

export function InvoiceStampedEmail({
  clientName,
  businessName,
  folioLabel,
  total,
  currency,
  uuid,
  stampedAt,
}: InvoiceStampedEmailProps) {
  return (
    <EmailLayout preview={`Factura ${folioLabel} — ${total} ${currency}`}>
      <Preview>Factura {folioLabel} — {total} {currency}</Preview>

      {/* Card container */}
      <Section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
        }}
      >
        <EmailHeader />

        {/* Greeting */}
        <Text
          style={{
            fontSize: '15px',
            lineHeight: '24px',
            color: '#19213d',
            margin: '0 0 16px 0',
          }}
        >
          Hola {clientName},
        </Text>

        <Text
          style={{
            fontSize: '15px',
            lineHeight: '24px',
            color: '#19213d',
            margin: '0 0 24px 0',
          }}
        >
          Se ha emitido la factura <strong>{folioLabel}</strong> por{' '}
          <strong>{total} {currency}</strong>.
        </Text>

        {/* Invoice summary card */}
        <Section
          style={{
            backgroundColor: '#f4f4f5',
            borderRadius: '8px',
            padding: '20px',
            margin: '0 0 24px 0',
          }}
        >
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#868da6', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Folio
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '14px', color: '#19213d', margin: '0', fontWeight: '600', fontFamily: 'monospace' }}>
                {folioLabel}
              </Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#868da6', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Total
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '14px', color: '#10b981', margin: '0', fontWeight: '700', fontFamily: 'monospace' }}>
                {total} {currency}
              </Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#868da6', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                UUID
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '11px', color: '#19213d', margin: '0', fontFamily: 'monospace' }}>
                {uuid}
              </Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={{ fontSize: '12px', color: '#868da6', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                Fecha
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: '13px', color: '#19213d', margin: '0' }}>
                {stampedAt}
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Attachments note */}
        <Text
          style={{
            fontSize: '14px',
            lineHeight: '22px',
            color: '#5d6481',
            margin: '0 0 8px 0',
          }}
        >
          Adjunto encontrarás:
        </Text>
        <Text
          style={{
            fontSize: '14px',
            lineHeight: '22px',
            color: '#5d6481',
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
