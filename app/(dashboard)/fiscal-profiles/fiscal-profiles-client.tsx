'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/dialog'

import { IssuingProfileCard } from '@features/fiscal-profile/components/issuing-profile-card'
import { IssuingProfileForm } from '@features/fiscal-profile/components/issuing-profile-form'
import { createIssuingProfileAction } from '@features/fiscal-profile/actions/create-issuing-profile.action'
import { updateIssuingProfileAction } from '@features/fiscal-profile/actions/update-issuing-profile.action'
import type { IssuingProfile } from '@features/fiscal-profile/types/fiscal-profile.types'
import type { CatalogOption } from '@shared/services/sat-catalog.service'

interface FiscalProfilesClientProps {
  profiles: IssuingProfile[]
  taxRegimes: CatalogOption[]
}

export function FiscalProfilesClient({ profiles, taxRegimes }: FiscalProfilesClientProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<IssuingProfile | null>(null)

  const handleCreate = async (input: Parameters<typeof createIssuingProfileAction>[0]) => {
    try {
      await createIssuingProfileAction(input)
      toast.success('Perfil creado')
      setShowCreate(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el perfil')
      throw error
    }
  }

  const handleEdit = async (input: Parameters<typeof updateIssuingProfileAction>[1]) => {
    if (!editTarget) return
    try {
      await updateIssuingProfileAction(editTarget.id, input)
      toast.success('Perfil actualizado')
      setEditTarget(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el perfil')
      throw error
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo RFC
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            Aún no tienes perfiles fiscales.
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primer perfil
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => (
            <IssuingProfileCard
              key={profile.id}
              profile={profile}
              onEdit={setEditTarget}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo perfil fiscal</DialogTitle>
          </DialogHeader>
          <IssuingProfileForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            taxRegimes={taxRegimes}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil — {editTarget?.rfc}</DialogTitle>
          </DialogHeader>
          <IssuingProfileForm
            initialData={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            taxRegimes={taxRegimes}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
