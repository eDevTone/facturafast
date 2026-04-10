'use client'

import { KeyRound, ShieldCheck, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@shared/ui/input'

export interface CsdFile {
  name: string
  base64: string
}

interface CsdUploadFieldsProps {
  cerFile: CsdFile | null
  keyFile: CsdFile | null
  keyPassword: string
  onCerChange: (file: CsdFile | null) => void
  onKeyChange: (file: CsdFile | null) => void
  onPasswordChange: (password: string) => void
  /** Show section wrapper with title/description */
  showWrapper?: boolean
}

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export function CsdUploadFields({
  cerFile,
  keyFile,
  keyPassword,
  onCerChange,
  onKeyChange,
  onPasswordChange,
  showWrapper = true,
}: CsdUploadFieldsProps) {
  const handleCerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.cer')) {
      toast.error('Selecciona un archivo .cer')
      return
    }
    const base64 = await readFileAsBase64(file)
    onCerChange({ name: file.name, base64 })
  }

  const handleKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.key')) {
      toast.error('Selecciona un archivo .key')
      return
    }
    const base64 = await readFileAsBase64(file)
    onKeyChange({ name: file.name, base64 })
  }

  const showPassword = !!(cerFile || keyFile)

  const fields = (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* .cer upload */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Certificado (.cer)
          </label>
          {cerFile ? (
            <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{cerFile.name}</span>
              <button
                type="button"
                onClick={() => onCerChange(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Eliminar archivo .cer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 hover:border-muted-foreground/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Subir .cer</span>
              <input
                type="file"
                accept=".cer"
                className="sr-only"
                onChange={handleCerChange}
              />
            </label>
          )}
        </div>

        {/* .key upload */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Llave privada (.key)
          </label>
          {keyFile ? (
            <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{keyFile.name}</span>
              <button
                type="button"
                onClick={() => onKeyChange(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Eliminar archivo .key"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 hover:border-muted-foreground/50 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Subir .key</span>
              <input
                type="file"
                accept=".key"
                className="sr-only"
                onChange={handleKeyChange}
              />
            </label>
          )}
        </div>
      </div>

      {/* Password field — appears when at least one file is uploaded */}
      {showPassword && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            Contraseña del certificado
          </label>
          <Input
            type="password"
            togglePassword
            placeholder="Contraseña de la llave privada"
            value={keyPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Se almacena encriptada con AES-256. Nunca en texto plano.
          </p>
        </div>
      )}
    </>
  )

  if (!showWrapper) {
    return <div className="space-y-4">{fields}</div>
  }

  return (
    <div className="rounded-lg border border-dashed p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Certificado de Sello Digital (CSD)</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Necesario para timbrar facturas reales. Puedes agregarlo después.
        </p>
      </div>
      {fields}
    </div>
  )
}
