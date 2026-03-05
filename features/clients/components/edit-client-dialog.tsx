'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { ClientForm } from './client-form'
import { updateClientAction } from '../actions/update-client.action'
import type { Client } from '../types/client.types'

interface EditClientDialogProps {
  client: Client
}

export function EditClientDialog({ client }: EditClientDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    const result = await updateClientAction(client.id, formData)
    
    if (result.success) {
      toast.success('Cliente actualizado correctamente')
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
          }}
          submitLabel="Actualizar Cliente"
        />
      </DialogContent>
    </Dialog>
  )
}
