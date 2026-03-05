import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { InvoiceList } from '@features/invoicing/components/invoice-list'
import { getInvoices } from '@features/invoicing/services/invoice.service'
import { Button } from '@shared/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FacturasPage() {
  const { userId } = await auth()

  if (!userId) {
    notFound()
  }

  const invoices = await getInvoices(userId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Facturas
            {invoices.length > 0 && (
              <span className="ml-2.5 text-sm font-normal text-muted-foreground">
                {invoices.length}
              </span>
            )}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Gestiona tus facturas CFDI 4.0
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      {/* Invoice List */}
      <InvoiceList invoices={invoices} />
    </div>
  )
}
