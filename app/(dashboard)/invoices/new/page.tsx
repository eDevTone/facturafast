import { auth } from '@clerk/nextjs/server'
import { getCatalogItems } from '@features/catalog/services/catalog.service'
import { getClients } from '@features/clients/services/client.service'
import { getAllIssuingProfiles, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { getClientFormCatalogs, getInvoiceFormCatalogs } from '@shared/services/sat-catalog.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { clientId } = await searchParams
  const [clients, catalogs, clientCatalogs, profiles, defaultProfile, catalogItems] = await Promise.all([
    getClients(userId),
    getInvoiceFormCatalogs(),
    getClientFormCatalogs(),
    getAllIssuingProfiles(userId),
    getDefaultIssuingProfile(userId),
    getCatalogItems(userId),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/invoices"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-tinta-tenue transition-colors hover:text-tinta"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Facturas
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight">Nueva factura</h1>
      </div>

      <InvoiceForm
        clients={clients}
        catalogs={catalogs}
        clientCatalogs={clientCatalogs}
        profiles={profiles}
        defaultProfileId={defaultProfile?.id}
        initialClientId={clientId}
        catalogItems={catalogItems}
        today={todayInMexico()}
      />
    </div>
  )
}
