'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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
import { CsdUploadFields, type CsdFile } from './csd-upload-fields'

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

  const [cerFile, setCerFile] = useState<CsdFile | null>(
    initialData?.cerFilename && initialData?.cerBase64
      ? { name: initialData.cerFilename, base64: initialData.cerBase64 }
      : null,
  )
  const [keyFile, setKeyFile] = useState<CsdFile | null>(
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
        <CsdUploadFields
          cerFile={cerFile}
          keyFile={keyFile}
          keyPassword={keyPassword}
          onCerChange={setCerFile}
          onKeyChange={setKeyFile}
          onPasswordChange={setKeyPassword}
        />

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
