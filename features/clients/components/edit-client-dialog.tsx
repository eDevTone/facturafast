'use client'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { CatalogOption } from '@shared/services/sat-catalog.service'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { updateClientAction } from '../actions/update-client.action'
import type { Client } from '../types/client.types'
import { ClientForm } from './client-form'

interface EditClientDialogProps {
  client: Client
  catalogs: {
    taxRegimes: CatalogOption[]
    cfdiUsages: CatalogOption[]
  }
}

export function EditClientDialog({ client, catalogs }: EditClientDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const result = await updateClientAction(client.id, formData)
    
    if (result.success) {
      setOpen(false)
      return result
    } else {
      toast.error(result.error || 'Error al actualizar el cliente')
      return result
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <ClientForm
          onSubmit={handleSubmit}
          defaultValues={{
            rfc: client.rfc,
            businessName: client.businessName,
            email: client.email || '',
            phone: client.phone || '',
            postalCode: client.postalCode,
            taxRegime: client.taxRegime || '',
            cfdiUsage: client.cfdiUsage || '',
          }}
          submitLabel="Actualizar Cliente"
          onCancel={() => setOpen(false)}
          catalogs={catalogs}
        />
      </DialogContent>
    </Dialog>
  )
}
