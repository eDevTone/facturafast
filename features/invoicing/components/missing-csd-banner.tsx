'use client'

import { useState } from 'react'

import { CsdUploadDialog } from '@features/fiscal-profile/components/csd-upload-dialog'
import { Button } from '@shared/ui/button'

interface MissingCsdBannerProps {
  profileId: string
  profileName: string
}

export function MissingCsdBanner({ profileId, profileName }: MissingCsdBannerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-3 rounded-[4px] border border-ocre/40 bg-ocre-tenue px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-tinta">Falta tu CSD para timbrar</p>
          <p className="mt-0.5 text-[13px] text-tinta-tenue">
            Sube el .cer, el .key y la contraseña del sello de <span className="text-tinta">{profileName}</span>.
            Es distinto de tu e.firma; lo generas en CertiSAT.
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 border-ocre/50" onClick={() => setOpen(true)}>
          Subir CSD
        </Button>
      </div>

      <CsdUploadDialog
        profileId={profileId}
        profileName={profileName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
