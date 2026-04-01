'use client'

import { useState, useTransition } from 'react'
import { Building2, ShieldCheck, ShieldOff, Star, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
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
    ? `cursor-pointer transition-all ${selected ? 'ring-2 ring-primary bg-primary/[0.03]' : 'hover:border-border'}`
    : 'hover:border-border'

  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-5 transition-colors ${cardClass}`}
      onClick={() => selectable && onSelect?.(profile)}
    >
      {/* Top: icon + RFC + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${profile.isDefault ? 'bg-primary/10' : 'bg-muted/60'}`}>
            <Building2 className={`h-4 w-4 ${profile.isDefault ? 'text-primary' : 'text-muted-foreground/60'}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-semibold text-sm text-foreground">{profile.rfc}</span>
              {profile.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                  <Star className="h-2.5 w-2.5" />
                  Default
                </span>
              )}
              {selected && (
                <span className="inline-flex items-center rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Seleccionado
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">{profile.businessName}</p>
            <p className="text-[12px] text-muted-foreground/40 mt-1">
              Régimen {profile.taxRegime} · CP {profile.postalCode}
            </p>
          </div>
        </div>

        {/* CSD badge */}
        {!selectable && (
          <div className="shrink-0">
            {hasCSD ? (
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                expired
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-primary/10 text-primary'
              }`}>
                {expired ? <ShieldOff className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                {expired ? 'CSD vencido' : 'CSD listo'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                <ShieldOff className="h-3 w-3" />
                Sin CSD
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions (non-selectable mode) */}
      {!selectable && (
        <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40">
          {!profile.isDefault && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSetDefault}
              disabled={pending}
              className="text-[12px] h-7 text-muted-foreground hover:text-foreground"
            >
              <Star className="h-3 w-3 mr-1" />
              Predeterminar
            </Button>
          )}

          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(profile)}
              className="text-[12px] h-7 text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="text-[12px] h-7 text-muted-foreground/40 hover:text-destructive ml-auto"
                disabled={pending}
              >
                <Trash2 className="h-3 w-3" />
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
        <div className="mt-3 flex items-center gap-2">
          {hasCSD ? (
            <span className={`text-[12px] flex items-center gap-1 ${expired ? 'text-destructive' : 'text-primary'}`}>
              <ShieldCheck className="h-3 w-3" />
              {expired ? 'CSD vencido' : 'CSD cargado'}
            </span>
          ) : (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <ShieldOff className="h-3 w-3" />
              Sin CSD
            </span>
          )}
        </div>
      )}
    </div>
  )
}
