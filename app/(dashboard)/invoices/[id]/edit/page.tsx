import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getInvoiceById } from '@features/invoicing/services/invoice.service'
import { getClients } from '@features/clients/services/client.service'
import { InvoiceForm } from '@features/invoicing/components/invoice-form'

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

  const [invoice, clients] = await Promise.all([
    getInvoiceById(id, userId),
    getClients(userId),
  ])

  if (!invoice || invoice.status !== 'draft') {
    notFound()
  }

  const invoiceLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link
          href={`/invoices/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {invoiceLabel}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Editar Factura
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Modifica el borrador {invoiceLabel}
        </p>
      </div>

      <InvoiceForm clients={clients} invoice={invoice} />
    </div>
  )
}
