'use client'

import { useState, useTransition } from 'react'
import { Building2, ShieldCheck, ShieldOff, Star, Trash2, Pencil, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import { Badge } from '@shared/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui/alert-dialog'

import { profileHasCSD, isCertExpired } from '../types/fiscal-profile.types'
import { setDefaultIssuingProfileAction } from '../actions/update-issuing-profile.action'
import { deleteIssuingProfileAction as deleteAction } from '../actions/delete-issuing-profile.action'
import type { IssuingProfile } from '../types/fiscal-profile.types'

interface IssuingProfileCardProps {
  profile: IssuingProfile
  onEdit?: (profile: IssuingProfile) => void
  /** Picker mode: card is selectable, no edit/delete actions */
  selectable?: boolean
  selected?: boolean
  onSelect?: (profile: IssuingProfile) => void
}

export function IssuingProfileCard({
  profile,
  onEdit,
  selectable = false,
  selected = false,
  onSelect,
}: IssuingProfileCardProps) {
  const [pending, startTransition] = useTransition()
  const hasCSD = profileHasCSD(profile)
  const expired = isCertExpired(profile)

  const handleSetDefault = () => {
    startTransition(async () => {
      try {
        await setDefaultIssuingProfileAction(profile.id)
        toast.success('Perfil establecido como predeterminado')
      } catch {
        toast.error('Error al actualizar el perfil')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAction(profile.id)
        toast.success('Perfil eliminado')
      } catch {
        toast.error('Error al eliminar el perfil')
      }
    })
  }

  const cardClass = selectable
    ? `cursor-pointer transition-all ${selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:ring-1 hover:ring-border'}`
    : ''

  return (
    <div
      className={`rounded-xl border bg-card p-4 ${cardClass}`}
      onClick={() => selectable && onSelect?.(profile)}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: icon + info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${profile.isDefault ? 'bg-primary/10' : 'bg-muted'}`}>
            <Building2 className={`h-5 w-5 ${profile.isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-sm">{profile.rfc}</span>
              {profile.isDefault && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Star className="h-3 w-3" />
                  Predeterminado
                </Badge>
              )}
              {selected && (
                <Badge className="text-xs">Seleccionado</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{profile.businessName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Régimen {profile.taxRegime} · CP {profile.postalCode}
            </p>
          </div>
        </div>

        {/* Right: CSD badge + actions */}
        {!selectable && (
          <div className="flex items-center gap-2 shrink-0">
            {hasCSD ? (
              <Badge variant="outline" className={`gap-1 text-xs ${expired ? 'border-red-300 text-red-600' : 'border-green-300 text-green-700'}`}>
                {expired ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                {expired ? 'CSD vencido' : 'CSD listo'}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs border-yellow-300 text-yellow-700">
                <ShieldOff className="h-3 w-3" />
                Sin CSD
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Actions (non-selectable mode) */}
      {!selectable && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t">
          {!profile.isDefault && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSetDefault}
              disabled={pending}
              className="text-xs h-7"
            >
              <Star className="h-3 w-3 mr-1" />
              Predeterminar
            </Button>
          )}

          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(profile)}
              className="text-xs h-7"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 text-destructive hover:text-destructive ml-auto"
                disabled={pending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar perfil?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará el perfil <strong>{profile.rfc}</strong>. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* CSD status in selectable mode */}
      {selectable && (
        <div className="mt-2 flex items-center gap-2">
          {hasCSD ? (
            <span className={`text-xs flex items-center gap-1 ${expired ? 'text-red-500' : 'text-green-600'}`}>
              <ShieldCheck className="h-3 w-3" />
              {expired ? 'CSD vencido' : 'CSD cargado'}
            </span>
          ) : (
            <span className="text-xs text-yellow-600 flex items-center gap-1">
              <ShieldOff className="h-3 w-3" />
              Sin CSD
            </span>
          )}
        </div>
      )}
    </div>
  )
}
