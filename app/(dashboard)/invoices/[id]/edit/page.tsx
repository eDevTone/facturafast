import { auth } from '@clerk/nextjs/server'
import { getCatalogItems } from '@features/catalog/services/catalog.service'
import { getClients } from '@features/clients/services/client.service'
import { getAllIssuingProfiles, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import { getInvoiceById, getInvoiceRelations } from '@features/invoicing/services/invoice.service'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { getClientFormCatalogs, getInvoiceFormCatalogs } from '@shared/services/sat-catalog.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  const { id } = await params

  if (!userId) {
    notFound()
  }

  const [invoice, clients, catalogs, clientCatalogs, profiles, defaultProfile, catalogItems] = await Promise.all([
    getInvoiceById(id, userId),
    getClients(userId),
    getInvoiceFormCatalogs(),
    getClientFormCatalogs(),
    getAllIssuingProfiles(userId),
    getDefaultIssuingProfile(userId),
    getCatalogItems(userId),
  ])

  if (!invoice || invoice.status !== 'draft') {
    notFound()
  }

  const { replaces } = await getInvoiceRelations(invoice, userId)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/invoices/${id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-tinta-tenue transition-colors hover:text-tinta"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al borrador
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight">{replaces ? 'Corregir factura' : 'Editar borrador'}</h1>
      </div>

      <InvoiceForm
        clients={clients}
        invoice={invoice}
        catalogs={catalogs}
        clientCatalogs={clientCatalogs}
        profiles={profiles}
        defaultProfileId={defaultProfile?.id}
        replaces={replaces}
        catalogItems={catalogItems}
        today={todayInMexico()}
      />
    </div>
  )
}
