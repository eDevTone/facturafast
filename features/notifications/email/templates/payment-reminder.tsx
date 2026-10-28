import { Column, Preview, Row, Section, Text } from '@react-email/components'
import { EmailFooter } from '../components/email-footer'
import { EmailHeader } from '../components/email-header'
import { EmailLayout } from '../components/email-layout'
import { amountWithCurrency } from '../components/email-payment-details'

interface PaymentReminderEmailProps {
  businessName: string
  /** Serie-folio of the invoice, e.g. "A-12". */
  folioLabel: string
  /** The reminder as the user left it in the dialog; it already carries the payment details. */
  message: string
  /** Still owed, formatted in the invoice currency. */
  balance: string
  currency: string
  /** "19 oct 2026"; null when the invoice has no due date. */
  dueDate: string | null
  overdue: boolean
}

const labelStyle = { fontSize: '12px', color: '#5e5e66', margin: '0', fontWeight: '600' } as const
const valueStyle = { fontSize: '13px', color: '#141414', margin: '0' } as const
const monoStyle = { ...valueStyle, fontFamily: '"IBM Plex Mono", Menlo, monospace' } as const

/** "Recordar pago" by email: the user's message, what is owed, and the invoice XML and PDF again. */
export function PaymentReminderEmail({ businessName, folioLabel, message, balance, currency, dueDate, overdue }: PaymentReminderEmailProps) {
  const paragraphs = message.split(/\n{2,}/).map((paragraph) => paragraph.split('\n'))
  const owed = amountWithCurrency(balance, currency)

  return (
    <EmailLayout preview={`Recordatorio de pago de la factura ${folioLabel} — ${owed}`}>
      <Preview>Recordatorio de pago de la factura {folioLabel} — {owed}</Preview>

      <Section style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '32px' }}>
        <EmailHeader />

        {paragraphs.map((lines, index) => (
          <Text key={index} style={{ fontSize: '15px', lineHeight: '24px', color: '#141414', margin: '0 0 16px 0' }}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line}
              </span>
            ))}
          </Text>
        ))}

        <Section style={{ backgroundColor: '#f5f5f7', borderRadius: '4px', padding: '20px', margin: '8px 0 24px 0' }}>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={labelStyle}>Factura</Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ ...monoStyle, fontSize: '14px', fontWeight: '600' }}>{folioLabel}</Text>
            </Column>
          </Row>
          <Row style={{ padding: '4px 0' }}>
            <Column>
              <Text style={labelStyle}>Saldo pendiente</Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ ...monoStyle, fontSize: '14px', color: '#2f4ba8', fontWeight: '700' }}>{owed}</Text>
            </Column>
          </Row>
          {dueDate && (
            <Row style={{ padding: '4px 0' }}>
              <Column>
                <Text style={labelStyle}>{overdue ? 'Venció' : 'Vence'}</Text>
              </Column>
              <Column style={{ textAlign: 'right' }}>
                <Text style={{ ...valueStyle, color: overdue ? '#b8382a' : '#141414' }}>{dueDate}</Text>
              </Column>
            </Row>
          )}
        </Section>

        <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#5e5e66', margin: '0 0 24px 0' }}>
          Te adjuntamos de nuevo el XML y el PDF de la factura. Si ya la pagaste, ignora este mensaje.
        </Text>

        <EmailFooter businessName={businessName} />
      </Section>
    </EmailLayout>
  )
}

export default PaymentReminderEmail
