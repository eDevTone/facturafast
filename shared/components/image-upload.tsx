'use client'

import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { Button } from '@shared/ui/button'

interface ImageUploadProps {
  value?: string | null
  onChange: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  placeholder?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  accept = 'image/png,image/jpeg,image/webp',
  maxSizeMB = 2,
  placeholder = 'Arrastra una imagen o haz click para subir',
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(value ?? null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes')
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`La imagen no debe superar ${maxSizeMB}MB`)
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      onChange(file)
    },
    [maxSizeMB, onChange],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          <div className="flex items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-3 overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="max-h-24 max-w-full object-contain rounded"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="text-[12px] h-7"
            >
              <Upload className="h-3 w-3 mr-1.5" />
              Cambiar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-[12px] h-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Eliminar
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 transition-colors cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/[0.03]'
              : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
            <ImagePlus className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="text-[12px] text-muted-foreground/60">{placeholder}</p>
          <p className="text-[10px] text-muted-foreground/40">
            PNG, JPG o WebP · Máximo {maxSizeMB}MB
          </p>
        </button>
      )}

      {error && (
        <p className="mt-1.5 text-[11px] text-destructive">{error}</p>
      )}
    </div>
  )
}
