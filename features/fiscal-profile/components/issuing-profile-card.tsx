'use client'

import { useTransition } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { formatDate } from '@shared/utils/date'
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

import { csdDaysLeftLabel, csdExpiry, type CsdExpiry } from '../utils/csd-expiry'
import { CsdRenewalGuide } from './csd-renewal-guide'
import { setDefaultIssuingProfileAction } from '../actions/update-issuing-profile.action'
import { deleteIssuingProfileAction as deleteAction } from '../actions/delete-issuing-profile.action'
import type { PublicIssuingProfile } from '../types/fiscal-profile.types'

interface IssuingProfileCardProps {
  profile: PublicIssuingProfile
  /** Régimen description, e.g. "Régimen Simplificado de Confianza". */
  taxRegimeLabel?: string
  onEdit?: (profile: PublicIssuingProfile) => void
}

/** CSD state as a small stamp: valid until a date, about to expire, expired, or missing. */
function CsdStamp({ profile, expiry }: { profile: PublicIssuingProfile; expiry: CsdExpiry }) {
  if (!profile.hasCsd) {
    return <span className="sello-mini text-ocre">Sin CSD</span>
  }
  if (expiry.state === 'vencido') {
    return <span className="sello-mini text-tinta-roja">CSD vencido</span>
  }
  if (expiry.state === 'por_vencer') {
    return <span className="sello-mini text-ocre">CSD {csdDaysLeftLabel(expiry.daysLeft)}</span>
  }
  return (
    <span className="sello-mini text-sello">
      CSD vigente
      {profile.certValidUntil && (
        <span className="font-normal">
          hasta {formatDate(profile.certValidUntil, { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )}
    </span>
  )
}

export function IssuingProfileCard({ profile, taxRegimeLabel, onEdit }: IssuingProfileCardProps) {
  const [pending, startTransition] = useTransition()
  const expiry = csdExpiry(profile.certValidUntil)

  const handleSetDefault = () => {
    startTransition(async () => {
      try {
        await setDefaultIssuingProfileAction(profile.id)
        toast.success(`${profile.rfc} es ahora tu RFC predeterminado`)
      } catch {
        toast.error('No se pudo cambiar el RFC predeterminado', { description: 'Inténtalo de nuevo.' })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteAction(profile.id)
        toast.success('Perfil eliminado')
      } catch {
        toast.error('No se pudo eliminar el perfil', { description: 'Inténtalo de nuevo.' })
      }
    })
  }

  return (
    <article className="hoja flex min-w-0 flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-[15px] font-medium text-tinta">{profile.rfc}</p>
          <p className="mt-0.5 truncate text-sm text-tinta">{profile.businessName}</p>
        </div>
        {profile.isDefault && <span className="text-[12px] font-medium text-sello">Predeterminado</span>}
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-renglon pt-3 text-[13px]">
        <dt className="text-tinta-tenue">Régimen</dt>
        <dd className="min-w-0 truncate text-tinta" title={taxRegimeLabel}>
          <span className="font-mono">{profile.taxRegime}</span>
          {taxRegimeLabel && <span className="text-tinta-tenue"> {taxRegimeLabel}</span>}
        </dd>
        <dt className="text-tinta-tenue">CP fiscal</dt>
        <dd className="font-mono text-tinta">{profile.postalCode}</dd>
        <dt className="text-tinta-tenue">Sellos</dt>
        <dd className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <CsdStamp profile={profile} expiry={expiry} />
          {(!profile.hasCsd || expiry.state !== 'vigente') && <CsdRenewalGuide />}
        </dd>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-renglon pt-3">
        {!profile.isDefault && (
          <Button size="sm" variant="ghost" onClick={handleSetDefault} disabled={pending}>
            Usar como predeterminado
          </Button>
        )}

        {onEdit && (
          <Button size="sm" variant="ghost" onClick={() => onEdit(profile)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto hover:text-destructive"
              disabled={pending}
              aria-label={`Eliminar el perfil ${profile.rfc}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar el perfil {profile.rfc}?</AlertDialogTitle>
              <AlertDialogDescription>
                Ya no podrás facturar con este RFC ni con su CSD. Las facturas que ya timbraste se conservan.
                No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar perfil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  )
}
