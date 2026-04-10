'use client'

import { ShieldAlert } from 'lucide-react'
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
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>

          <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Faltan certificados CSD
              </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              El perfil <span className="font-medium text-foreground">{profileName}</span> no
              tiene certificados configurados. Súbelos para poder timbrar esta factura.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="bg-amber-500 hover:bg-amber-500/90 text-white"
            >
              Subir certificados
            </Button>
          </div>
        </div>
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
