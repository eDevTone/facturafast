'use client'

import { useState } from 'react'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Card, CardContent } from '@shared/ui/card'

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
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB
        setError('El archivo debe ser menor a 5MB')
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
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:application/pdf;base64,
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // TODO: Call real extraction API
      // const response = await fetch('/api/csf/extract', {
      //   method: 'POST',
      //   body: JSON.stringify({ pdf: base64 }),
      //   headers: { 'Content-Type': 'application/json' }
      // })
      // const data = await response.json()

      // Mock extraction (simular API response)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay

      const mockData = {
        rfc: 'XAXX010101000',
        razonSocial: 'EMPRESA EJEMPLO SA DE CV',
        regimenFiscal: '601',
        codigoPostal: '76000'
      }

      onDataExtracted(mockData)
      setFile(null) // Clear file after extraction
    } catch (err) {
      console.error('CSF extraction error:', err)
      setError('Error al extraer datos del CSF. Intenta de nuevo.')
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <Card className="border-dashed border-2">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Acta de Situación Fiscal (Opcional)
              </h3>
              <p className="text-sm text-muted-foreground">
                Sube el PDF del CSF para llenar automáticamente el formulario
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex-1">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isExtracting}
              />
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Haz clic o arrastra el PDF del CSF aquí
                  </p>
                )}
              </div>
            </label>

            <Button
              onClick={handleExtract}
              disabled={!file || isExtracting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extrayendo...
                </>
              ) : (
                'Extraer Datos'
              )}
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <p className="text-xs text-muted-foreground">
            El sistema extraerá automáticamente: RFC, Razón Social, Régimen Fiscal y Código Postal
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
