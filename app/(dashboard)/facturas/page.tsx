import { InvoiceList } from '@features/invoicing/components/invoice-list'
import { getInvoices } from '@features/invoicing/services/invoice.service'
import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import { Button } from '@shared/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// Mark as dynamic to prevent static generation (no DB yet)
export const dynamic = 'force-dynamic'

export default async function FacturasPage() {
  // TODO: Get real user ID from Clerk
  const userId = 'temp-user-id'
  
  // Server Component - DB directo (sin API route)
  let invoices: InvoiceWithRelations[] = []
  try {
    invoices = await getInvoices(userId)
  } catch (error) {
    console.error('DB not available yet:', error)
  }
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todas tus facturas CFDI
          </p>
        </div>
        <Link href="/facturas/nueva">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        </Link>
      </div>
      
      {/* Invoice List */}
      <InvoiceList invoices={invoices} />
    </div>
  )
}
