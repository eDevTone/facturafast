'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Loader2, ShieldCheck, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select'

import { CSFUpload } from '@features/clients/components/csf-upload'
import { ImageUpload } from '@shared/components/image-upload'
import { uploadLogoAction } from '../actions/upload-logo.action'
import type { CatalogOption } from '@shared/services/sat-catalog.service'
import { issuingProfileFormSchema, type IssuingProfileFormValues } from '../schemas/issuing-profile-form.schema'
import type { CreateIssuingProfileInput, IssuingProfile } from '../types/fiscal-profile.types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface IssuingProfileFormProps {
  /** If provided, pre-fills the form for editing */
  initialData?: IssuingProfile | null
  /** Signed URL for the current logo (for preview in edit mode) */
  logoPreviewUrl?: string
  onSubmit: (input: CreateIssuingProfileInput) => Promise<void>
  onCancel?: () => void
  taxRegimes: CatalogOption[]
  /** Custom label for the submit button */
  submitLabel?: string
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IssuingProfileForm({
  initialData,
  logoPreviewUrl,
  onSubmit,
  onCancel,
  taxRegimes,
  submitLabel,
}: IssuingProfileFormProps) {
  const [submitting, setSubmitting] = useState(false)

  // CSD file state
  // Logo file state
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [cerFile, setCerFile] = useState<{ name: string; base64: string } | null>(
    initialData?.cerFilename && initialData?.cerBase64
      ? { name: initialData.cerFilename, base64: initialData.cerBase64 }
      : null,
  )
  const [keyFile, setKeyFile] = useState<{ name: string; base64: string } | null>(
    initialData?.keyFilename && initialData?.keyBase64
      ? { name: initialData.keyFilename, base64: initialData.keyBase64 }
      : null,
  )
  const [keyPassword, setKeyPassword] = useState('')

  const form = useForm<IssuingProfileFormValues>({
    resolver: zodResolver(issuingProfileFormSchema),
    defaultValues: {
      rfc: initialData?.rfc ?? '',
      businessName: initialData?.businessName ?? '',
      taxRegime: initialData?.taxRegime ?? '',
      postalCode: initialData?.postalCode ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
    },
  })

  // ── CSF auto-fill ─────────────────────────────────────────────────────────

  const handleCsfExtracted = (data: {
    rfc: string
    businessName: string
    taxRegime?: string
    postalCode: string
    email?: string
  }) => {
    if (data.rfc) form.setValue('rfc', data.rfc.toUpperCase())
    if (data.businessName) form.setValue('businessName', data.businessName)
    if (data.taxRegime) form.setValue('taxRegime', data.taxRegime)
    if (data.postalCode) form.setValue('postalCode', data.postalCode)
    if (data.email) form.setValue('email', data.email)
    toast.success('Datos extraídos de la constancia')
  }

  // ── File readers ────────────────────────────────────────────────────────────

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

  const handleCerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.cer')) {
      toast.error('Selecciona un archivo .cer')
      return
    }
    const base64 = await readFileAsBase64(file)
    setCerFile({ name: file.name, base64 })
  }

  const handleKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.key')) {
      toast.error('Selecciona un archivo .key')
      return
    }
    const base64 = await readFileAsBase64(file)
    setKeyFile({ name: file.name, base64 })
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (values: IssuingProfileFormValues) => {
    // Validar que si hay archivos CSD, estén completos
    const hasCer = !!cerFile
    const hasKey = !!keyFile
    const hasPassword = !!keyPassword

    if ((hasCer || hasKey) && !(hasCer && hasKey && hasPassword)) {
      toast.error('Para subir certificados necesitas el .cer, .key y la contraseña')
      return
    }

    setSubmitting(true)
    try {
      // Upload logo to R2 if a new file was selected
      let logoUrl: string | undefined
      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)
        const result = await uploadLogoAction(formData)
        if ('error' in result) {
          toast.error(result.error)
          setSubmitting(false)
          return
        }
        logoUrl = result.logoUrl
      }

      const input: CreateIssuingProfileInput = {
        rfc: values.rfc.toUpperCase(),
        businessName: values.businessName,
        taxRegime: values.taxRegime,
        postalCode: values.postalCode,
        email: values.email,
        phone: values.phone || undefined,
        logoUrl,
        ...(cerFile ? { cerFilename: cerFile.name, cerBase64: cerFile.base64 } : {}),
        ...(keyFile ? { keyFilename: keyFile.name, keyBase64: keyFile.base64 } : {}),
        ...(keyPassword ? { keyPassword } : {}),
      }
      await onSubmit(input)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el perfil')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const showCsdPassword = !!(cerFile || keyFile)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* CSF Upload — solo en modo creación */}
        {!initialData && (
          <CSFUpload onDataExtracted={handleCsfExtracted} />
        )}

        {/* Row: RFC + Razón social */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rfc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RFC</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="XAXX010101000"
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    maxLength={13}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Mi Empresa SA de CV" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Régimen + CP */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="taxRegime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Régimen Fiscal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taxRegimes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="76000" maxLength={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Row: Email + Teléfono */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="facturas@empresa.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Teléfono <span className="text-muted-foreground text-xs">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="4421234567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Logo */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
            Logo de la empresa
          </label>
          <ImageUpload
            value={logoPreviewUrl ?? null}
            onChange={setLogoFile}
            placeholder="Sube el logo de tu empresa"
            maxSizeMB={2}
          />
          <p className="text-[11px] text-muted-foreground/40 mt-1.5">
            Aparecerá en tus facturas PDF. Recomendado: cuadrado, fondo transparente.
          </p>
        </div>

        {/* CSD Section */}
        <div className="rounded-lg border border-dashed p-4 space-y-4">
          <div>
            <p className="text-sm font-medium">Certificado de Sello Digital (CSD)</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Necesario para timbrar facturas reales. Puedes agregarlo después.
            </p>
          </div>

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
                    onClick={() => setCerFile(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
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
                    onClick={() => setKeyFile(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
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

          {/* Contraseña del .key — aparece cuando se sube .cer o .key */}
          {showCsdPassword && (
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
                onChange={(e) => setKeyPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se almacena encriptada con AES-256. Nunca en texto plano.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel ?? (initialData ? 'Guardar cambios' : 'Crear perfil')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
