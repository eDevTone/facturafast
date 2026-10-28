'use client'

import { Loader2 } from 'lucide-react'
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
      toast.error('Faltan datos del CSD', { description: 'Sube el .cer, el .key y escribe su contraseña.' })
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
        toast.success('CSD guardado', { description: 'Ya puedes timbrar con este RFC.' })
        reset()
        onOpenChange(false)
      } else {
        toast.error('No se pudo guardar el CSD', { description: result.error })
      }
    })
  }

  const isComplete = !!(cerFile && keyFile && keyPassword)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir tu CSD</DialogTitle>
          <DialogDescription>
            Para timbrar como <span className="font-medium text-foreground">{profileName}</span> sube el
            certificado (.cer), la llave privada (.key) y su contraseña. Es tu CSD de CertiSAT, no tu e.firma.
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
            variant="ghost"
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
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar CSD
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
