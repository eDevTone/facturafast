import { Resend } from 'resend'
import { render } from '@react-email/components'
import { InvoiceStampedEmail } from '../email/templates/invoice-stamped'

const resend = new Resend(process.env.RESEND_API_KEY)

// TODO: Cambiar cuando se configure dominio propio en Resend
// Sin dominio verificado, Resend solo permite enviar desde onboarding@resend.dev
// y solo al email del owner de la cuenta
const FROM = 'onboarding@resend.dev'
const OVERRIDE_TO = 'eqs.playground@gmail.com'

interface SendInvoiceEmailParams {
  to: string
  businessName: string
  clientName: string
  folioLabel: string
  total: string
  currency: string
  uuid: string
  stampedAt: string
  xmlBuffer: Buffer
  pdfBuffer: Buffer
}

/**
 * Send stamped invoice to the receptor via email with XML + PDF attached.
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const { to, businessName, clientName, folioLabel, total, currency, uuid, stampedAt, xmlBuffer, pdfBuffer } = params

  const html = await render(
    InvoiceStampedEmail({
      clientName,
      businessName,
      folioLabel,
      total,
      currency,
      uuid,
      stampedAt,
    }),
  )

  // TODO: Usar `to` real cuando se configure dominio en Resend
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [OVERRIDE_TO],
    subject: `Factura ${folioLabel} — ${businessName}`,
    html,
    attachments: [
      {
        filename: `factura-${folioLabel}.xml`,
        content: xmlBuffer,
      },
      {
        filename: `factura-${folioLabel}.pdf`,
        content: pdfBuffer,
      },
    ],
  })

  if (error) {
    console.error('[Email] Failed to send invoice email:', error)
    throw new Error(error.message)
  }

  console.log('[Email] Invoice sent:', { to, folioLabel, emailId: data?.id })
  return data
}
