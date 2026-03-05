import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getInvoiceById } from '@features/invoicing/services/invoice.service'
import { getFiscalProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
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

  const [invoice, fiscalProfile] = await Promise.all([
    getInvoiceById(id, userId),
    getFiscalProfile(userId),
  ])

  if (!invoice) {
    notFound()
  }

  const emisor = fiscalProfile
    ? {
        rfc: fiscalProfile.rfc,
        businessName: fiscalProfile.businessName,
        taxRegime: fiscalProfile.taxRegime,
        postalCode: fiscalProfile.postalCode,
        fiscalAddress: fiscalProfile.fiscalAddress,
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

      <InvoiceDetail invoice={invoice} emisor={emisor} />
    </div>
  )
}
