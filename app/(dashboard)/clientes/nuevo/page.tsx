import { ClientForm } from '@features/clients/components/client-form'

export default function NewClientPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Nuevo Cliente</h1>
        <p className="text-muted-foreground mt-1">
          Agrega un nuevo cliente a tu catálogo
        </p>
      </div>
      
      {/* Client Form */}
      <ClientForm />
    </div>
  )
}
