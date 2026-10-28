'use client'

import { useState } from 'react'
import { Upload, FileText, Loader2, X } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { extractCsfAction } from '../actions/extract-csf.action'
import { mapCsfToClientData } from '../services/csf-extraction.service'

interface CSFUploadProps {
  /** Reads the PDF; the public page of "Pedir datos a un cliente" passes one that checks its link. */
  extract?: (formData: FormData) => ReturnType<typeof extractCsfAction>
  onDataExtracted: (data: {
    rfc: string
    businessName: string
    taxRegime?: string
    postalCode: string
  }) => void
}

export function CSFUpload({ extract = extractCsfAction, onDataExtracted }: CSFUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('La constancia debe ser un PDF. Descárgala del portal del SAT y súbela de nuevo.')
      setFile(null)
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El PDF pesa más de 10 MB. Sube la constancia original que descargaste del SAT.')
      setFile(null)
      return
    }
    setFile(selectedFile)
    setError(null)
  }

  const handleExtract = async () => {
    if (!file) return

    setIsExtracting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await extract(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      const clientData = mapCsfToClientData(result.data)

      onDataExtracted(clientData)
      setFile(null)
    } catch (err) {
      console.error('CSF extraction error:', err)
      const errorMessage = err instanceof Error ? err.message : 'No pudimos leer la constancia. Escribe los datos a mano.'
      setError(errorMessage)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="csf-upload"
          className={`flex cursor-pointer items-center gap-4 rounded-[4px] border border-dashed px-5 py-4 transition-colors ${
            isDragOver
              ? 'border-sello bg-sello-tenue/60'
              : file
                ? 'border-sello/60 bg-sello-tenue/40'
                : 'border-tinta-tenue/40 bg-hoja hover:border-sello/60'
          }`}
        >
          <FileText className={`h-5 w-5 shrink-0 ${file ? 'text-sello' : 'text-tinta-tenue'}`} />

          <div className="flex-1 min-w-0">
            {file ? (
              <>
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  <span className="font-mono">{(file.size / 1024).toFixed(0)} KB</span>, listo para leer
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Llenar con la Constancia de Situación Fiscal
                </p>
                <p className="text-[12px] text-muted-foreground">
                  Arrastra el PDF aquí o haz clic para elegirlo. Puedes saltarte este paso.
                </p>
              </>
            )}
          </div>

          {file ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Quitar archivo"
                onClick={(e) => {
                  e.preventDefault()
                  setFile(null)
                  setError(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.preventDefault()
                  handleExtract()
                }}
                disabled={isExtracting}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Leyendo…
                  </>
                ) : (
                  'Leer datos'
                )}
              </Button>
            </div>
          ) : (
            <Upload className="h-4 w-4 shrink-0 text-tinta-tenue" />
          )}

          <input
            id="csf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="sr-only"
            disabled={isExtracting}
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <p role="alert" className="rounded-[4px] border-l-2 border-tinta-roja bg-hoja px-4 py-2.5 text-[13px] text-tinta-roja">
          {error}
        </p>
      )}
    </div>
  )
}
