'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { deleteInvoiceAction } from '../actions/delete-invoice.action'

interface DeleteInvoiceDialogProps {
  invoiceId: string
  invoiceLabel: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteInvoiceDialog({ invoiceId, invoiceLabel, open: controlledOpen, onOpenChange: controlledOnOpenChange }: DeleteInvoiceDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen

  const handleDelete = async () => {
    setIsDeleting(true)

    const result = await deleteInvoiceAction(invoiceId)

    if (result.success) {
      toast.success('Factura eliminada')
      setOpen(false)
      router.push('/invoices')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al eliminar la factura')
    }

    setIsDeleting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar factura</DialogTitle>
          <DialogDescription>
            Estás a punto de eliminar la factura <strong className="text-foreground">{invoiceLabel}</strong>.
            Solo se pueden eliminar borradores.
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
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
