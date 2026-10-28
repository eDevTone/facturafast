import { Resend } from 'resend'
import { render } from '@react-email/components'
import { InvoiceStampedEmail } from '../email/templates/invoice-stamped'
import { PaymentReminderEmail } from '../email/templates/payment-reminder'
import { PaymentStampedEmail } from '../email/templates/payment-stamped'
import { RecurringDigestEmail, type RecurringDigestRow } from '../email/templates/recurring-digest'
import { ClientDataReceivedEmail } from '../email/templates/client-data-received'
import { CsdExpiringEmail } from '../email/templates/csd-expiring'

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
  /** "19 nov 2026"; only for an invoice still owed. */
  dueDate?: string | null
  /** Payment details lines; only for an invoice still owed. */
  paymentDetails?: string[]
  xmlBuffer: Buffer
  pdfBuffer: Buffer
}

/**
 * Send stamped invoice to the receptor via email with XML + PDF attached.
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams) {
  const { to, businessName, clientName, folioLabel, total, currency, uuid, stampedAt, dueDate, paymentDetails, xmlBuffer, pdfBuffer } = params

  const html = await render(
    InvoiceStampedEmail({
      clientName,
      businessName,
      folioLabel,
      total,
      currency,
      uuid,
      stampedAt,
      dueDate,
      paymentDetails,
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

interface SendPaymentEmailParams {
  to: string
  businessName: string
  clientName: string
  folioLabel: string
  invoiceLabel: string
  installment: string
  amount: string
  /** MonedaP. */
  currency: string
  remainingBalance: string
  isPaidOff: boolean
  paidOn: string
  uuid: string
  xmlBuffer: Buffer
  pdfBuffer: Buffer
}

/**
 * Send a stamped complemento de pago to the receptor with its XML + PDF attached.
 */
export async function sendPaymentEmail(params: SendPaymentEmailParams) {
  const { to, xmlBuffer, pdfBuffer, ...content } = params

  const html = await render(PaymentStampedEmail(content))

  // TODO: Usar `to` real cuando se configure dominio en Resend
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [OVERRIDE_TO],
    subject: `Complemento de pago ${content.folioLabel} — ${content.businessName}`,
    html,
    attachments: [
      { filename: `complemento-pago-${content.folioLabel}.xml`, content: xmlBuffer },
      { filename: `complemento-pago-${content.folioLabel}.pdf`, content: pdfBuffer },
    ],
  })

  if (error) {
    console.error('[Email] Failed to send payment email:', error)
    throw new Error(error.message)
  }

  console.log('[Email] Payment sent:', { to, folioLabel: content.folioLabel, emailId: data?.id })
  return data
}

interface SendPaymentReminderEmailParams {
  to: string
  /** The issuer's email: the client's answer goes to the freelancer, not to FacturaFast. */
  replyTo?: string | null
  businessName: string
  folioLabel: string
  message: string
  balance: string
  currency: string
  dueDate: string | null
  overdue: boolean
  xmlBuffer: Buffer
  pdfBuffer: Buffer
}

/**
 * "Recordar pago": the user's reminder, with the invoice XML and PDF attached again.
 */
export async function sendPaymentReminderEmail(params: SendPaymentReminderEmailParams) {
  const { to, replyTo, xmlBuffer, pdfBuffer, ...content } = params

  const html = await render(PaymentReminderEmail(content))

  // TODO: Usar `to` real cuando se configure dominio en Resend
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [OVERRIDE_TO],
    replyTo: replyTo || undefined,
    subject: `Recordatorio de pago: factura ${content.folioLabel} — ${content.businessName}`,
    html,
    attachments: [
      { filename: `factura-${content.folioLabel}.xml`, content: xmlBuffer },
      { filename: `factura-${content.folioLabel}.pdf`, content: pdfBuffer },
    ],
  })

  if (error) {
    console.error('[Email] Failed to send payment reminder:', error)
    throw new Error(error.message)
  }

  console.log('[Email] Payment reminder sent:', { to, folioLabel: content.folioLabel, emailId: data?.id })
  return data
}

interface SendRecurringDigestEmailParams {
  /** The user's email: the one in their fiscal profile. */
  to: string
  /** "1 de noviembre" */
  dateLabel: string
  rows: RecurringDigestRow[]
  listUrl: string
}

/**
 * "Facturas de cada mes": one email a day to the user with what the cron made and what is left to them.
 */
export async function sendRecurringDigestEmail(params: SendRecurringDigestEmailParams) {
  const { to, dateLabel, rows, listUrl } = params
  const html = await render(RecurringDigestEmail({ dateLabel, rows, listUrl }))
  const pending = rows.filter((row) => row.tone !== 'done').length

  // TODO: Usar `to` real cuando se configure dominio en Resend
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [OVERRIDE_TO],
    subject: pending > 0
      ? `Facturas de cada mes: ${pending === 1 ? 'tienes 1 pendiente' : `tienes ${pending} pendientes`}`
      : `Facturas de cada mes del ${dateLabel}: listas`,
    html,
  })

  if (error) {
    console.error('[Email] Failed to send recurring digest:', error)
    throw new Error(error.message)
  }

  console.log('[Email] Recurring digest sent:', { to, rows: rows.length, emailId: data?.id })
  return data
}

interface SendClientDataReceivedEmailParams {
  /** The user's email: the one in their fiscal profile. */
  to: string
  clientName: string
  rfc: string
  updated: boolean
  clientUrl: string
  invoiceUrl: string
}

/**
 * "Pedir datos a un cliente": tells the user the client typed their data.
 */
export async function sendClientDataReceivedEmail(params: SendClientDataReceivedEmailParams) {
  const { to, ...content } = params
  const html = await render(ClientDataReceivedEmail(content))

  // TODO: Usar `to` real cuando se configure dominio en Resend
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [OVERRIDE_TO],
    subject: `${content.clientName} ${content.updated ? 'actualizó' : 'llenó'} sus datos fiscales`,
    html,
  })

  if (error) {
    console.error('[Email] Failed to send client data notice:', error)
    throw new Error(error.message)
  }

  console.log('[Email] Client data notice sent:', { to, emailId: data?.id })
  return data
}

interface SendCsdExpiringEmailParams {
  /** The user's email: the one in their fiscal profile. */
  to: string
  rfc: string
  daysLeftLabel: string
  lastDayLabel: string
  profilesUrl: string
  requestUrl: string
}

/**
 * CSD about to expire: sent by the daily cron 30, 7 and 1 days before.
 */
export async function sendCsdExpiringEmail(params: SendCsdExpiringEmailParams) {
  const { to, ...content } = params
  const html = await render(CsdExpiringEmail(content))

  // TODO: Usar `to` real cuando se configure dominio en Resend
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [OVERRIDE_TO],
    subject: `Tu CSD de ${content.rfc} ${content.daysLeftLabel}`,
    html,
  })

  if (error) {
    console.error('[Email] Failed to send CSD expiry notice:', error)
    throw new Error(error.message)
  }

  console.log('[Email] CSD expiry notice sent:', { to, rfc: content.rfc, emailId: data?.id })
  return data
}
