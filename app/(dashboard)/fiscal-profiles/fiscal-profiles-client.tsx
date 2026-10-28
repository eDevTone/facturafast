'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/dialog'

import { IssuingProfileCard } from '@features/fiscal-profile/components/issuing-profile-card'
import { IssuingProfileForm } from '@features/fiscal-profile/components/issuing-profile-form'
import { createIssuingProfileAction } from '@features/fiscal-profile/actions/create-issuing-profile.action'
import { updateIssuingProfileAction } from '@features/fiscal-profile/actions/update-issuing-profile.action'
import type { PublicIssuingProfile } from '@features/fiscal-profile/types/fiscal-profile.types'
import type { TaxRegimeOption } from '@shared/services/sat-catalog.service'

interface FiscalProfilesClientProps {
  profiles: PublicIssuingProfile[]
  taxRegimes: TaxRegimeOption[]
  logoUrls?: Record<string, string>
}

export function FiscalProfilesClient({ profiles, taxRegimes, logoUrls = {} }: FiscalProfilesClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<PublicIssuingProfile | null>(null)

  const regimeLabels = useMemo(
    () => Object.fromEntries(taxRegimes.map(r => [r.value, r.label.replace(/^\d+\s*-\s*/, '')])),
    [taxRegimes],
  )

  // A failure is thrown back to the form, which shows it.
  const handleCreate = async (input: Parameters<typeof createIssuingProfileAction>[0]) => {
    const result = await createIssuingProfileAction(input)
    if ('error' in result) throw new Error(result.error)
    toast.success('Perfil guardado')
    setShowCreate(false)
  }

  const handleEdit = async (input: Parameters<typeof updateIssuingProfileAction>[1]) => {
    if (!editTarget) return
    const result = await updateIssuingProfileAction(editTarget.id, input)
    if ('error' in result) throw new Error(result.error)
    toast.success('Cambios guardados')
    setEditTarget(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Perfiles fiscales</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Los RFC con los que facturas y sus sellos digitales (CSD).
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Nuevo RFC
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="hoja-borrador px-6 py-14 text-center">
          <p className="text-base font-medium text-tinta">Aún no registras un RFC</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
            Agrega el RFC con el que vas a facturar y sube tu CSD para poder timbrar.
          </p>
          <Button className="mt-5" onClick={() => setShowCreate(true)}>
            Agregar mi RFC
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {profiles.map((profile) => (
            <IssuingProfileCard
              key={profile.id}
              profile={profile}
              taxRegimeLabel={regimeLabels[profile.taxRegime]}
              onEdit={setEditTarget}
            />
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo RFC</DialogTitle>
          </DialogHeader>
          <IssuingProfileForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            taxRegimes={taxRegimes}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar <span className="font-mono">{editTarget?.rfc}</span>
            </DialogTitle>
          </DialogHeader>
          <IssuingProfileForm
            initialData={editTarget}
            logoPreviewUrl={editTarget ? logoUrls[editTarget.id] : undefined}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            taxRegimes={taxRegimes}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
