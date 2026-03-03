'use client'

import { useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Card, CardContent } from '@shared/ui/card'
import { extractCsfFromPdf, mapCsfToClientData } from '../services/csf-extraction.service'

interface CSFUploadProps {
  onDataExtracted: (data: {
    rfc: string
    razonSocial: string
    regimenFiscal?: string
    codigoPostal: string
  }) => void
}

export function CSFUpload({ onDataExtracted }: CSFUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF')
        setFile(null)
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB (match eip-api limit)
        setError('El archivo debe ser menor a 10MB')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setIsExtracting(true)
    setError(null)

    try {
      // Call real eip-api
      const csfData = await extractCsfFromPdf(file)
      
      // Map CSF data to client form format
      const clientData = mapCsfToClientData(csfData)
      
      onDataExtracted(clientData)
      setFile(null) // Clear file after extraction
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
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      setError(null)
    } else {
      setError('Solo se permiten archivos PDF')
    }
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-foreground">
                Subir Constancia de Situación Fiscal (CSF)
              </h3>
              <p className="text-sm text-muted-foreground">
                Extrae automáticamente RFC, Razón Social, Régimen Fiscal y Código Postal
              </p>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className="relative"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label
              htmlFor="csf-upload"
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 transition-colors hover:bg-muted/50"
            >
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                {file ? file.name : 'Arrastra tu CSF o haz clic para seleccionar'}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                PDF hasta 10MB
              </span>
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
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Extract Button */}
          {file && !error && (
            <Button
              onClick={handleExtract}
              disabled={isExtracting}
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extrayendo datos...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Extraer Datos del CSF
                </>
              )}
            </Button>
          )}

          {/* Help Text */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> Esta función extrae los datos
              fiscales del PDF de la Constancia de Situación Fiscal del SAT. Solo sube
              el archivo y los campos se llenarán automáticamente.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
