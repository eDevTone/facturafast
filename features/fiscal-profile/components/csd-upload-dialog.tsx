'use client'

import { Loader2, ShieldCheck } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'

import { uploadCertificatesAction } from '../actions/upload-certificates.action'
import { CsdUploadFields, type CsdFile } from './csd-upload-fields'

interface CsdUploadDialogProps {
  profileId: string
  profileName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CsdUploadDialog({
  profileId,
  profileName,
  open,
  onOpenChange,
}: CsdUploadDialogProps) {
  const [cerFile, setCerFile] = useState<CsdFile | null>(null)
  const [keyFile, setKeyFile] = useState<CsdFile | null>(null)
  const [keyPassword, setKeyPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setCerFile(null)
    setKeyFile(null)
    setKeyPassword('')
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSave = () => {
    if (!cerFile || !keyFile || !keyPassword) {
      toast.error('Necesitas el .cer, .key y la contraseña')
      return
    }

    startTransition(async () => {
      const result = await uploadCertificatesAction({
        profileId,
        cerFilename: cerFile.name,
        cerBase64: cerFile.base64,
        keyFilename: keyFile.name,
        keyBase64: keyFile.base64,
        keyPassword,
      })

      if (result.success) {
        toast.success('Certificados guardados correctamente')
        reset()
        onOpenChange(false)
      } else {
        toast.error('Error al guardar', { description: result.error })
      }
    })
  }

  const isComplete = !!(cerFile && keyFile && keyPassword)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Subir certificados CSD
          </DialogTitle>
          <DialogDescription>
            Para timbrar facturas con <span className="font-medium text-foreground">{profileName}</span>,
            sube tu certificado (.cer), llave privada (.key) y contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <CsdUploadFields
            cerFile={cerFile}
            keyFile={keyFile}
            keyPassword={keyPassword}
            onCerChange={setCerFile}
            onKeyChange={setKeyFile}
            onPasswordChange={setKeyPassword}
            showWrapper={false}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isComplete || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar certificados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
