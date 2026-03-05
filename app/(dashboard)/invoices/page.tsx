import { InvoiceList } from '@features/invoicing/components/invoice-list'
import { getInvoices } from '@features/invoicing/services/invoice.service'
import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import { Button } from '@shared/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FacturasPage() {
  // TODO: Get real user ID from Clerk
  const userId = 'temp-user-id'

  let invoices: InvoiceWithRelations[] = []
  try {
    invoices = await getInvoices(userId)
  } catch (error) {
    console.error('DB not available yet:', error)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Facturas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona todas tus facturas CFDI
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
