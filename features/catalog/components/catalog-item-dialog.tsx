'use client'

import type { ComboboxOption } from '@shared/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@shared/ui/dialog'
import { useState } from 'react'
import { toast } from 'sonner'
import { createCatalogItemAction } from '../actions/create-catalog-item.action'
import { updateCatalogItemAction } from '../actions/update-catalog-item.action'
import type { CatalogItemFormData } from '../schemas/catalog-item.schema'
import type { CatalogItem } from '../types/catalog.types'
import { CatalogItemForm } from './catalog-item-form'

interface CatalogItemDialogProps {
  /** Edits this service; without it the dialog creates one. */
  item?: CatalogItem
  productOptions: ComboboxOption[]
  unitOptions: ComboboxOption[]
  /** The button that opens the dialog. */
  trigger: React.ReactElement
}

/** Creates or edits a saved service. */
export function CatalogItemDialog({ item, productOptions, unitOptions, trigger }: CatalogItemDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSubmit = async (data: CatalogItemFormData) => {
    const result = item ? await updateCatalogItemAction(item.id, data) : await createCatalogItemAction(data)
    if (result.success) {
      toast.success(item ? 'Servicio actualizado' : 'Servicio guardado')
      setOpen(false)
    } else {
      toast.error('No se guardó el servicio', { description: result.error })
    }
    return result
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          <DialogDescription>
            {item
              ? 'Los cambios aplican a las facturas que hagas desde ahora; las que ya hiciste no cambian.'
              : 'Guarda lo que facturas seguido para llenarlo en un clic en tus facturas.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CatalogItemForm
            defaultValues={item ? {
              description: item.description,
              productServiceCode: item.productServiceCode,
              unit: item.unit,
              unitPrice: item.unitPrice === null ? null : Number(item.unitPrice),
            } : undefined}
            productOptions={productOptions}
            unitOptions={unitOptions}
            onSubmit={handleSubmit}
            submitLabel={item ? 'Guardar cambios' : 'Guardar servicio'}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
