'use client'

import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
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
  logoUrls?: Record<string, string>
}

export function FiscalProfilesClient({ profiles, taxRegimes, logoUrls = {} }: FiscalProfilesClientProps) {
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
        <div className="rounded-xl border border-border/60 bg-card">
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No hay perfiles fiscales
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Configura tu primer RFC emisor para comenzar a timbrar facturas.
            </p>
            <Button className="mt-5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer perfil
            </Button>
          </div>
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
