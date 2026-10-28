'use client'

import { KeyRound, ShieldCheck, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@shared/ui/input'
import { SectionLabel } from '@shared/components/section-label'

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
      toast.error('Ese archivo no es un .cer', { description: 'Elige el certificado que termina en .cer.' })
      return
    }
    const base64 = await readFileAsBase64(file)
    onCerChange({ name: file.name, base64 })
  }

  const handleKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.key')) {
      toast.error('Ese archivo no es un .key', { description: 'Elige la llave privada que termina en .key.' })
      return
    }
    const base64 = await readFileAsBase64(file)
    onKeyChange({ name: file.name, base64 })
  }

  // Stored files (empty base64) need no password; only a new upload does.
  const showPassword = !!(cerFile?.base64 || keyFile?.base64)

  const fields = (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* .cer upload */}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-tinta">Certificado (.cer)</span>
          {cerFile ? (
            <div className="flex items-center gap-2 rounded-[4px] border border-sello/40 bg-sello-tenue/50 px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-sello" />
              <span className="flex-1 truncate font-mono text-[12px] text-tinta">{cerFile.name}</span>
              {!cerFile.base64 && <span className="text-[11px] text-tinta-tenue">guardado</span>}
              <button
                type="button"
                onClick={() => onCerChange(null)}
                className="text-tinta-tenue transition-colors hover:text-tinta"
                aria-label={cerFile.base64 ? 'Quitar archivo .cer' : 'Reemplazar archivo .cer'}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-[4px] border border-dashed border-tinta-tenue/40 bg-hoja px-3 py-2 transition-colors hover:border-sello/60 focus-within:border-sello">
              <Upload className="h-4 w-4 text-tinta-tenue" />
              <span className="text-[13px] text-tinta-tenue">Elegir archivo .cer</span>
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
          <span className="mb-1.5 block text-[13px] font-medium text-tinta">Llave privada (.key)</span>
          {keyFile ? (
            <div className="flex items-center gap-2 rounded-[4px] border border-sello/40 bg-sello-tenue/50 px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-sello" />
              <span className="flex-1 truncate font-mono text-[12px] text-tinta">{keyFile.name}</span>
              {!keyFile.base64 && <span className="text-[11px] text-tinta-tenue">guardado</span>}
              <button
                type="button"
                onClick={() => onKeyChange(null)}
                className="text-tinta-tenue transition-colors hover:text-tinta"
                aria-label={keyFile.base64 ? 'Quitar archivo .key' : 'Reemplazar archivo .key'}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-[4px] border border-dashed border-tinta-tenue/40 bg-hoja px-3 py-2 transition-colors hover:border-sello/60 focus-within:border-sello">
              <Upload className="h-4 w-4 text-tinta-tenue" />
              <span className="text-[13px] text-tinta-tenue">Elegir archivo .key</span>
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
          <label htmlFor="csd-password" className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-tinta">
            <KeyRound className="h-3.5 w-3.5 text-tinta-tenue" />
            Contraseña de la llave privada
          </label>
          <Input
            id="csd-password"
            type="password"
            togglePassword
            autoComplete="off"
            placeholder="La que pusiste al generar tu CSD"
            value={keyPassword}
            onChange={(e) => onPasswordChange(e.target.value)}
          />
          <p className="mt-1 text-[12px] text-tinta-tenue">
            Se guarda cifrada y solo se usa para sellar tus facturas.
          </p>
        </div>
      )}
    </>
  )

  if (!showWrapper) {
    return <div className="space-y-4">{fields}</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <SectionLabel>Certificado de sello digital (CSD)</SectionLabel>
        <p className="mt-2 text-[13px] text-tinta-tenue">
          Lo necesitas para timbrar. Es distinto de tu e.firma: se tramita en CertiSAT. Puedes agregarlo después.
        </p>
      </div>
      {fields}
    </div>
  )
}
