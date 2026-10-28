import { auth } from '@clerk/nextjs/server'
import { getOrCreateAccount } from '@features/billing/services/account.service'
import { getLastReminder } from '@features/collections/services/collection.service'
import { collectionState } from '@features/collections/utils/collection-state'
import { getDefaultIssuingProfile, getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { InvoiceDetail } from '@features/invoicing/components/invoice-detail'
import { getInvoiceById, getInvoiceRelations } from '@features/invoicing/services/invoice.service'
import { getInvoicePayments, stampedTotal } from '@features/payments/services/payment.service'
import { getRecurringOfInvoice } from '@features/recurring/services/recurring.service'
import { summarizeBalance } from '@features/payments/utils/payment-amounts'
import { formatCfdiDate, todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { getFileSignedUrl } from '@features/storage/services/r2.service'
import { getCfdiUsageLabels, getCountryLabels, getPaymentFormLabels, getPaymentMethodLabels, getTaxRegimeLabels } from '@shared/services/sat-catalog.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ timbrar?: string }>
}) {
  const { userId } = await auth()
  const { id } = await params
  const { timbrar } = await searchParams

  if (!userId) {
    notFound()
  }

  const [invoice, account, paymentFormLabels, paymentMethodLabels, cfdiUsageLabels, taxRegimeLabels, countryLabels] = await Promise.all([
    getInvoiceById(id, userId),
    getOrCreateAccount(userId),
    getPaymentFormLabels(),
    getPaymentMethodLabels(),
    getCfdiUsageLabels(),
    getTaxRegimeLabels(),
    getCountryLabels(),
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

  const relations = await getInvoiceRelations(invoice, userId)

  // A PPD invoice gets its payments noted on the talón; a PUE one was paid when issued.
  const isPpd = invoice.paymentMethod === 'PPD' && invoice.status !== 'draft'
  const paymentList = isPpd ? await getInvoicePayments(invoice.id, userId) : []
  const payments = isPpd
    ? {
        list: paymentList,
        balance: summarizeBalance(stampedTotal(invoice), paymentList),
        paymentFormOptions: Object.entries(paymentFormLabels)
          .filter(([code]) => code !== '99')
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([code, description]) => ({ value: code, label: description, hint: code })),
        today: todayInMexico(),
        invoiceDay: formatCfdiDate(invoice.issuedAt).slice(0, 10),
      }
    : undefined

  const paymentDetails = profile
    ? { bankName: profile.bankName, clabe: profile.clabe, paymentLink: profile.paymentLink, holder: profile.businessName }
    : null

  const emisor = profile
    ? {
        id: profile.id,
        rfc: profile.rfc,
        businessName: profile.businessName,
        taxRegime: profile.taxRegime,
        postalCode: profile.postalCode,
        logoUrl,
        certSerialNumber: profile.certSerialNumber ?? null,
        hasCsd: profile.hasCsd,
        payment: paymentDetails,
      }
    : null

  // Who owes what: from the talón's payments (PPD) or the PUE's own mark.
  const today = todayInMexico()
  const state = collectionState(
    invoice,
    { total: stampedTotal(invoice), paid: payments?.balance.paid ?? 0 },
    today,
  )
  const collection = state
    ? { state, today, lastReminder: await getLastReminder(invoice.id, userId), payment: paymentDetails }
    : undefined

  // "Repetir cada mes": offered on stamped invoices; noted on those that belong to one.
  const recurring = invoice.status !== 'cancelada'
    ? { summary: await getRecurringOfInvoice(invoice, userId), today, issuedDay: formatCfdiDate(invoice.issuedAt).slice(0, 10) }
    : undefined

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-tinta-tenue transition-colors hover:text-tinta"
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
          countries: countryLabels,
        }}
        stampsBalance={account.stampsBalance}
        openStampDialog={timbrar === '1' && invoice.status === 'draft'}
        payments={payments}
        relations={relations}
        collection={collection}
        recurring={recurring}
      />
    </div>
  )
}
