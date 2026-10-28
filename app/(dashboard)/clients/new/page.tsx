import { ClientForm } from '@features/clients/components/client-form'
import { getClientFormCatalogs } from '@shared/services/sat-catalog.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewClientPage() {
  const catalogs = await getClientFormCatalogs()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Clientes
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Nuevo cliente
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Sube su constancia fiscal para llenar los datos, o escríbelos tú.
        </p>
      </div>

      {/* Client Form */}
      <ClientForm catalogs={catalogs} />
    </div>
  )
}
