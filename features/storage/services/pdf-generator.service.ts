import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { InvoicePdfDocument } from '@features/invoicing/components/invoice-pdf-document'
import { getIssuingProfileById, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getPaymentFormLabels, getPaymentMethodLabels, getCfdiUsageLabels } from '@shared/services/sat-catalog.service'
import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'

/**
 * Generate a PDF buffer server-side for a stamped invoice.
 * Uses the same InvoicePdfDocument component as the client preview.
 */
export async function generateInvoicePdf(
  invoice: InvoiceWithRelations,
  userId: string,
): Promise<Buffer> {
  const [profile, paymentFormLabels, paymentMethodLabels, cfdiUsageLabels] =
    await Promise.all([
      invoice.issuingProfileId
        ? getIssuingProfileById(invoice.issuingProfileId, userId)
        : getDefaultIssuingProfile(userId),
      getPaymentFormLabels(),
      getPaymentMethodLabels(),
      getCfdiUsageLabels(),
    ])

  const emisor = profile
    ? {
        rfc: profile.rfc,
        businessName: profile.businessName,
        taxRegime: profile.taxRegime,
        postalCode: profile.postalCode,
      }
    : null

  const element = createElement(InvoicePdfDocument, {
    invoice,
    emisor,
    labels: {
      paymentForms: paymentFormLabels,
      paymentMethods: paymentMethodLabels,
      cfdiUsages: cfdiUsageLabels,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)
  return Buffer.from(buffer)
}
