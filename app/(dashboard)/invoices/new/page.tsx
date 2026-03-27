import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import { getClients } from '@features/clients/services/client.service'
import { getAllIssuingProfiles, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { getInvoiceFormCatalogs } from '@shared/services/sat-catalog.service'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const [clients, catalogs, profiles, defaultProfile] = await Promise.all([
    getClients(userId),
    getInvoiceFormCatalogs(),
    getAllIssuingProfiles(userId),
    getDefaultIssuingProfile(userId),
  ])

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Nueva Factura
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Crea una factura CFDI 4.0
        </p>
      </div>

      <InvoiceForm
        clients={clients}
        catalogs={catalogs}
        profiles={profiles}
        defaultProfileId={defaultProfile?.id}
      />
    </div>
  )
}
