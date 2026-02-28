import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import { getClients } from '@features/clients/services/client.service'

export default async function NewInvoicePage() {
  // TODO: Get real user ID from Clerk
  const userId = 'temp-user-id'
  
  // Server Component - Get clients from DB
  const clients = await getClients(userId)
  
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nueva Factura</h1>
        <p className="text-muted-foreground mt-1">
          Crea una nueva factura CFDI 4.0
        </p>
      </div>
      
      {/* Invoice Form */}
      <InvoiceForm clients={clients} />
    </div>
  )
}
