import Link from 'next/link'
import { DashboardStats } from '@features/dashboard/components/dashboard-stats'
import { InvoiceList } from '@features/invoicing/components/invoice-list'
import { getInvoices } from '@features/invoicing/services/invoice.service'
import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import { Button } from '@shared/ui/button'
import { Plus, ArrowRight } from 'lucide-react'

// Mark as dynamic to prevent static generation (no DB yet)
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // TODO: Get real user ID from Clerk
  const userId = 'temp-user-id'
  
  // Server Component - Get data
  let allInvoices: InvoiceWithRelations[] = []
  try {
    allInvoices = await getInvoices(userId)
  } catch (error) {
    console.error('DB not available yet:', error)
  }
  
  // Calculate stats (mock for now)
  const stats = {
    totalFacturado: allInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0),
    facturasEsteMes: allInvoices.length,
    clientesActivos: 18, // Mock
    crecimiento: 12 // Mock
  }
  
  // Recent invoices (last 5)
  const recentInvoices = allInvoices.slice(0, 5)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Nav */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">FacturaFast</h1>
          <div className="flex items-center gap-4">
            <Link href="/facturas">
              <Button variant="ghost">Facturas</Button>
            </Link>
            <Link href="/clientes">
              <Button variant="ghost">Clientes</Button>
            </Link>
            <Link href="/facturas/nueva">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Bienvenido a FacturaFast - Sistema de facturación CFDI 4.0
          </p>
        </div>
        
        {/* Stats */}
        <DashboardStats stats={stats} />
        
        {/* Recent Invoices */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">
              Facturas Recientes
            </h3>
            <Link href="/facturas">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <InvoiceList invoices={recentInvoices} />
        </div>
      </main>
    </div>
  )
}
