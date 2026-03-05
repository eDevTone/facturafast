import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import { getClients } from '@features/clients/services/client.service'
import { auth } from '@clerk/nextjs/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Client } from '@features/clients/types/client.types'

export const dynamic = 'force-dynamic'

export default async function NewInvoicePage() {
  const { userId } = await auth()

  let clients: Client[] = []
  if (userId) {
    try {
      clients = await getClients(userId)
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Page Header */}
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

      {/* Invoice Form */}
      <InvoiceForm clients={clients} />
    </div>
  )
}
