'use client'

import { useState } from 'react'
import { Upload, FileText, Loader2, X } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { extractCsfAction } from '../actions/extract-csf.action'
import { mapCsfToClientData } from '../services/csf-extraction.service'

interface CSFUploadProps {
  onDataExtracted: (data: {
    rfc: string
    businessName: string
    taxRegime?: string
    postalCode: string
  }) => void
}

export function CSFUpload({ onDataExtracted }: CSFUploadProps) {
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
      setError('Solo se permiten archivos PDF')
      setFile(null)
      return
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo debe ser menor a 10MB')
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
      const result = await extractCsfAction(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      const clientData = mapCsfToClientData(result.data)

      onDataExtracted(clientData)
      setFile(null)
    } catch (err) {
      console.error('CSF extraction error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al extraer datos del CSF'
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
          className={`flex cursor-pointer items-center gap-4 rounded-xl border border-dashed px-5 py-4 transition-colors ${
            isDragOver
              ? 'border-primary/60 bg-primary/5'
              : file
                ? 'border-primary/40 bg-primary/5'
                : 'border-border/60 hover:border-border hover:bg-muted/30'
          }`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            file ? 'bg-primary/15' : 'bg-muted'
          }`}>
            <FileText className={`h-4.5 w-4.5 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>

          <div className="flex-1 min-w-0">
            {file ? (
              <>
                <p className="text-sm font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB — Listo para extraer
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Constancia de Situación Fiscal
                </p>
                <p className="text-[12px] text-muted-foreground">
                  Arrastra tu CSF o haz clic para autocompletar los datos
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
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
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
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Extrayendo...
                  </>
                ) : (
                  'Extraer datos'
                )}
              </Button>
            </div>
          ) : (
            <Upload className="h-4 w-4 shrink-0 text-muted-foreground/50" />
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
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <p className="text-[13px] text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}
