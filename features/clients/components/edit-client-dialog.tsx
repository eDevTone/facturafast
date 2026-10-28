'use client'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import type { CatalogOption, CountryOption, TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { updateClientAction } from '../actions/update-client.action'
import type { ClientFormData } from '../schemas/client-form.schema'
import type { Client } from '../types/client.types'
import { isForeignClient, ivaRateChoice } from '../utils/foreign-client'
import { ClientForm } from './client-form'

interface EditClientDialogProps {
  client: Client
  catalogs: {
    taxRegimes: TaxRegimeOption[]
    cfdiUsages: CatalogOption[]
    countries: CountryOption[]
  }
}

export function EditClientDialog({ client, catalogs }: EditClientDialogProps) {
  const [open, setOpen] = useState(false)

  // ClientForm shows the toast; here we only close on success.
  const handleSubmit = async (data: ClientFormData) => {
    const result = await updateClientAction(client.id, data)
    if (result.success) setOpen(false)
    return result
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Editar ${client.businessName}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <ClientForm
          onSubmit={handleSubmit}
          showCSFUpload={false}
          defaultValues={{
            isForeign: isForeignClient(client),
            rfc: isForeignClient(client) ? '' : client.rfc,
            businessName: client.businessName,
            email: client.email || '',
            phone: client.phone || '',
            postalCode: client.postalCode || '',
            taxRegime: client.taxRegime || '',
            cfdiUsage: client.cfdiUsage || '',
            country: client.country || '',
            foreignTaxId: client.foreignTaxId || '',
            ivaRate: ivaRateChoice(client.ivaRate),
            paymentTermsDays: client.paymentTermsDays,
          }}
          submitLabel="Guardar cambios"
          onCancel={() => setOpen(false)}
          catalogs={catalogs}
        />
      </DialogContent>
    </Dialog>
  )
}
