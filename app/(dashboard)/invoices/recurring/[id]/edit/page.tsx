import { auth } from '@clerk/nextjs/server'
import { getCatalogItems } from '@features/catalog/services/catalog.service'
import { getClients } from '@features/clients/services/client.service'
import { getAllIssuingProfiles, getDefaultIssuingProfile } from '@features/fiscal-profile/services/fiscal-profile.service'
import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import type { InvoiceFormData } from '@features/invoicing/schemas/invoice-form.schema'
import { IVA_RATE } from '@features/invoicing/utils/cfdi-amounts'
import { getRecurringTemplate } from '@features/recurring/services/recurring.service'
import { fillPeriod, periodFor } from '@features/recurring/utils/period'
import { monthOf } from '@features/recurring/utils/schedule'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'
import { getClientFormCatalogs, getInvoiceFormCatalogs } from '@shared/services/sat-catalog.service'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** "Cambiar conceptos" of a recurring invoice: the invoice form, saving its template. */
export default async function EditRecurringTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  const { id } = await params
  if (!userId) notFound()

  const [recurring, clients, catalogs, clientCatalogs, profiles, defaultProfile, catalogItems] = await Promise.all([
    getRecurringTemplate(id, userId).catch(() => null),
    getClients(userId),
    getInvoiceFormCatalogs(),
    getClientFormCatalogs(),
    getAllIssuingProfiles(userId),
    getDefaultIssuingProfile(userId),
    getCatalogItems(userId),
  ])
  if (!recurring) notFound()

  const { template } = recurring
  const example = fillPeriod('Diseño — {mes} {año}', periodFor(monthOf(recurring.nextRunOn), recurring.periodOffset))
  const values: InvoiceFormData = {
    clientId: template.clientId,
    issuingProfileId: template.issuingProfileId ?? '',
    serie: template.serie ?? '',
    paymentForm: template.paymentForm,
    paymentMethod: template.paymentMethod === 'PPD' ? 'PPD' : 'PUE',
    cfdiUsage: template.cfdiUsage,
    currency: template.currency === 'USD' ? 'USD' : 'MXN',
    exchangeRate: template.exchangeRate ?? null,
    exchangeRateSource: template.exchangeRateSource ?? null,
    ivaRate: template.ivaRate ?? IVA_RATE,
    pricesIncludeIva: template.pricesIncludeIva,
    isrWithholdingRate: template.isrWithholdingRate,
    ivaWithholdingRate: template.ivaWithholdingRate,
    paymentTermsDays: template.paymentTermsDays ?? null,
    items: template.items.map((item) => ({
      productServiceCode: item.productServiceCode,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit ?? 'E48',
      unitPrice: item.unitPrice,
    })),
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/invoices/recurring"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-tinta-tenue transition-colors hover:text-tinta"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Facturas de cada mes
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight">Cambiar conceptos</h1>
        <p className="mt-1 max-w-2xl text-sm text-tinta-tenue">
          Los cambios se usan desde la siguiente factura. Escribe <span className="font-mono text-tinta">{'{mes}'}</span> y{' '}
          <span className="font-mono text-tinta">{'{año}'}</span> donde va el mes: «Diseño — {'{mes} {año}'}» saldrá como «{example}» en la siguiente.
        </p>
      </div>

      <InvoiceForm
        clients={clients}
        catalogs={catalogs}
        clientCatalogs={clientCatalogs}
        profiles={profiles}
        defaultProfileId={defaultProfile?.id}
        catalogItems={catalogItems}
        today={todayInMexico()}
        template={{ id, values }}
      />
    </div>
  )
}
