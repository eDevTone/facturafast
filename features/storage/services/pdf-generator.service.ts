import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { InvoicePdfDocument } from '@features/invoicing/components/invoice-pdf-document'
import { PaymentPdfDocument } from '@features/payments/components/payment-pdf-document'
import { readPaymentCfdi } from '@features/payments/utils/payment-cfdi'
import { getIssuingProfileById, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getPaymentFormLabels, getPaymentMethodLabels, getCfdiUsageLabels, getTaxRegimeLabels, getCountryLabels } from '@shared/services/sat-catalog.service'
import { getFileSignedUrl } from '@features/storage/services/r2.service'
import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'

/**
 * Generate a PDF buffer server-side for a stamped invoice.
 * Uses the same InvoicePdfDocument component as the client preview.
 */
export async function generateInvoicePdf(
  invoice: InvoiceWithRelations,
  userId: string,
): Promise<Buffer> {
  const [profile, paymentFormLabels, paymentMethodLabels, cfdiUsageLabels, taxRegimeLabels, countryLabels] =
    await Promise.all([
      invoice.issuingProfileId
        ? getIssuingProfileById(invoice.issuingProfileId, userId)
        : getDefaultIssuingProfile(userId),
      getPaymentFormLabels(),
      getPaymentMethodLabels(),
      getCfdiUsageLabels(),
      getTaxRegimeLabels(),
      getCountryLabels(),
    ])

  // Get signed URL for logo if it exists
  let logoUrl: string | null = null
  if (profile?.logoUrl) {
    try {
      logoUrl = await getFileSignedUrl(profile.logoUrl)
    } catch {
      // Logo fetch failed — continue without logo
    }
  }

  const emisor = profile
    ? {
        rfc: profile.rfc,
        businessName: profile.businessName,
        taxRegime: profile.taxRegime,
        postalCode: profile.postalCode,
        logoUrl,
        certSerialNumber: profile.certSerialNumber ?? null,
        payment: { bankName: profile.bankName, clabe: profile.clabe, paymentLink: profile.paymentLink, holder: profile.businessName },
      }
    : null

  const element = createElement(InvoicePdfDocument, {
    invoice,
    emisor,
    labels: {
      paymentForms: paymentFormLabels,
      paymentMethods: paymentMethodLabels,
      cfdiUsages: cfdiUsageLabels,
      taxRegimes: taxRegimeLabels,
      countries: countryLabels,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)
  return Buffer.from(buffer)
}

/**
 * Generate the PDF of a stamped complemento de pago. Every value comes from its stamped XML,
 * so the printed representation matches the CFDI.
 */
export async function generatePaymentPdf(
  payment: { xmlContent: string; qrCode: string | null; satOriginalChain: string | null; issuingProfileId: string },
  userId: string,
): Promise<Buffer> {
  const [profile, paymentFormLabels, taxRegimeLabels, countryLabels] = await Promise.all([
    getIssuingProfileById(payment.issuingProfileId, userId),
    getPaymentFormLabels(),
    getTaxRegimeLabels(),
    getCountryLabels(),
  ])

  let logoUrl: string | null = null
  if (profile?.logoUrl) {
    try {
      logoUrl = await getFileSignedUrl(profile.logoUrl)
    } catch {
      // Logo fetch failed — continue without logo
    }
  }

  const element = createElement(PaymentPdfDocument, {
    cfdi: readPaymentCfdi(payment.xmlContent),
    qrCode: payment.qrCode,
    satOriginalChain: payment.satOriginalChain,
    logoUrl,
    labels: { paymentForms: paymentFormLabels, taxRegimes: taxRegimeLabels, countries: countryLabels },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)
  return Buffer.from(buffer)
}
