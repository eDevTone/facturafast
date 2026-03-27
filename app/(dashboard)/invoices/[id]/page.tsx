import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getInvoiceById } from '@features/invoicing/services/invoice.service'
import { getIssuingProfileById, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getPaymentFormLabels, getPaymentMethodLabels, getCfdiUsageLabels } from '@shared/services/sat-catalog.service'
import { InvoiceDetail } from '@features/invoicing/components/invoice-detail'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  const { id } = await params

  if (!userId) {
    notFound()
  }

  const [invoice, paymentFormLabels, paymentMethodLabels, cfdiUsageLabels] = await Promise.all([
    getInvoiceById(id, userId),
    getPaymentFormLabels(),
    getPaymentMethodLabels(),
    getCfdiUsageLabels(),
  ])

  if (!invoice) {
    notFound()
  }

  // Buscar el perfil emisor: primero el asociado a la factura, luego el default
  const profile = invoice.issuingProfileId
    ? await getIssuingProfileById(invoice.issuingProfileId, userId)
    : await getDefaultIssuingProfile(userId)

  const emisor = profile
    ? {
        rfc: profile.rfc,
        businessName: profile.businessName,
        taxRegime: profile.taxRegime,
        postalCode: profile.postalCode,
      }
    : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Facturas
        </Link>
      </div>

      <InvoiceDetail
        invoice={invoice}
        emisor={emisor}
        labels={{
          paymentForms: paymentFormLabels,
          paymentMethods: paymentMethodLabels,
          cfdiUsages: cfdiUsageLabels,
        }}
      />
    </div>
  )
}
