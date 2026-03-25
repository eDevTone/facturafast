'use client'

import { Building2, Plus } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Button } from '@shared/ui/button'

import { IssuingProfileCard } from './issuing-profile-card'
import type { IssuingProfile } from '../types/fiscal-profile.types'

interface IssuingProfilePickerProps {
  open: boolean
  profiles: IssuingProfile[]
  selectedId?: string
  onSelect: (profile: IssuingProfile) => void
  onOpenChange: (open: boolean) => void
  onAddNew?: () => void
}

/**
 * Dialog picker to choose which RFC/emisor to use when creating an invoice.
 */
export function IssuingProfilePicker({
  open,
  profiles,
  selectedId,
  onSelect,
  onOpenChange,
  onAddNew,
}: IssuingProfilePickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            ¿Con qué RFC facturar?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Sin perfiles configurados</p>
              <p className="text-xs text-muted-foreground mt-1">
                Agrega un RFC emisor para poder facturar
              </p>
            </div>
          ) : (
            profiles.map((profile) => (
              <IssuingProfileCard
                key={profile.id}
                profile={profile}
                selectable
                selected={profile.id === selectedId}
                onSelect={(p) => {
                  onSelect(p)
                  onOpenChange(false)
                }}
              />
            ))
          )}
        </div>

        {onAddNew && (
          <Button variant="outline" className="w-full" onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar nuevo RFC
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
