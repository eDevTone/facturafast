import { ClientList } from '@features/clients/components/client-list'
import { getClients } from '@features/clients/services/client.service'
import { Button } from '@shared/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ClientesPage() {
  // TODO: Get real user ID from Clerk
  const userId = 'temp-user-id'
  
  // Server Component - DB directo
  const clients = await getClients(userId)
  
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu catálogo de clientes
          </p>
        </div>
        <Link href="/clientes/nuevo">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>
      
      {/* Client List */}
      <ClientList clients={clients} />
    </div>
  )
}
