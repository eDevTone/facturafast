'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { deleteClientAction } from '../actions/delete-client.action'

interface DeleteClientDialogProps {
  clientId: string
  clientName: string
}

export function DeleteClientDialog({ clientId, clientName }: DeleteClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    const result = await deleteClientAction(clientId)

    if (result.success) {
      toast.success('Cliente eliminado')
      setOpen(false)
    } else {
      toast.error('No se pudo eliminar el cliente', { description: result.error || 'Inténtalo de nuevo.' })
    }

    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" aria-label={`Eliminar ${clientName}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            <strong className="text-foreground">{clientName}</strong> dejará de aparecer en tu lista de clientes.
            Las facturas que ya le timbraste se conservan y las puedes seguir descargando.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminando…' : 'Eliminar cliente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
