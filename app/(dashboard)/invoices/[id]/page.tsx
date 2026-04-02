import { auth } from '@clerk/nextjs/server'
import { getDefaultIssuingProfile, getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { InvoiceDetail } from '@features/invoicing/components/invoice-detail'
import { getInvoiceById } from '@features/invoicing/services/invoice.service'
import { getFileSignedUrl } from '@features/storage/services/r2.service'
import { getCfdiUsageLabels, getPaymentFormLabels, getPaymentMethodLabels, getTaxRegimeLabels } from '@shared/services/sat-catalog.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

  const [invoice, paymentFormLabels, paymentMethodLabels, cfdiUsageLabels, taxRegimeLabels] = await Promise.all([
    getInvoiceById(id, userId),
    getPaymentFormLabels(),
    getPaymentMethodLabels(),
    getCfdiUsageLabels(),
    getTaxRegimeLabels(),
  ])

  if (!invoice) {
    notFound()
  }

  // Buscar el perfil emisor: primero el asociado a la factura, luego el default
  const profile = invoice.issuingProfileId
    ? await getIssuingProfileById(invoice.issuingProfileId, userId)
    : await getDefaultIssuingProfile(userId)

  let logoUrl: string | null = null
  if (profile?.logoUrl) {
    try { logoUrl = await getFileSignedUrl(profile.logoUrl) } catch { /* ignore */ }
  }

  const emisor = profile
    ? {
        rfc: profile.rfc,
        businessName: profile.businessName,
        taxRegime: profile.taxRegime,
        postalCode: profile.postalCode,
        logoUrl,
        certSerialNumber: profile.certSerialNumber ?? null,
      }
    : null

  return (
    <div className="max-w-4xl mx-auto">
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
          taxRegimes: taxRegimeLabels,
        }}
      />
    </div>
  )
}
