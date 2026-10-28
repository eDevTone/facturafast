'use client'

import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { deleteCatalogItemAction } from '../actions/delete-catalog-item.action'

interface DeleteCatalogItemDialogProps {
  itemId: string
  description: string
}

export function DeleteCatalogItemDialog({ itemId, description }: DeleteCatalogItemDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteCatalogItemAction(itemId)
    setIsDeleting(false)

    if (result.success) {
      toast.success('Servicio eliminado')
      setOpen(false)
    } else {
      toast.error('No se pudo eliminar el servicio', { description: result.error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" aria-label={`Eliminar ${description}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar servicio</DialogTitle>
          <DialogDescription>
            <strong className="text-foreground">{description}</strong> dejará de aparecer en tus servicios. Las
            facturas donde lo usaste no cambian.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Eliminando…' : 'Eliminar servicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
