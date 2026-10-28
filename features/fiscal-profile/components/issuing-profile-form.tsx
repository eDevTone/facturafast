'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { Combobox } from '@shared/ui/combobox'
import { SectionLabel } from '@shared/components/section-label'
import { regimeFitsRfc } from '@shared/utils/rfc'

import { CSFUpload } from '@features/clients/components/csf-upload'
import { ImageUpload } from '@shared/components/image-upload'
import { uploadLogoAction } from '../actions/upload-logo.action'
import type { TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { issuingProfileFormSchema, type IssuingProfileFormValues } from '../schemas/issuing-profile-form.schema'
import type { CreateIssuingProfileInput, PublicIssuingProfile } from '../types/fiscal-profile.types'
import { CsdUploadFields, type CsdFile } from './csd-upload-fields'
import { PaymentDetailsFields } from './payment-details-fields'

// ── Props ─────────────────────────────────────────────────────────────────────

interface IssuingProfileFormProps {
  /** If provided, pre-fills the form for editing */
  initialData?: PublicIssuingProfile | null
  /** Signed URL for the current logo (for preview in edit mode) */
  logoPreviewUrl?: string
  onSubmit: (input: CreateIssuingProfileInput) => Promise<void>
  onCancel?: () => void
  taxRegimes: TaxRegimeOption[]
  /** Custom label for the submit button */
  submitLabel?: string
  /** "Para que te paguen"; onboarding leaves it for later. */
  showPaymentDetails?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IssuingProfileForm({
  initialData,
  logoPreviewUrl,
  onSubmit,
  onCancel,
  taxRegimes,
  submitLabel,
  showPaymentDetails = true,
}: IssuingProfileFormProps) {
  const [submitting, setSubmitting] = useState(false)

  // Logo file state
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // A stored CSD shows its file names with an empty base64: the files stay on the server.
  const [cerFile, setCerFile] = useState<CsdFile | null>(
    initialData?.hasCsd && initialData.cerFilename
      ? { name: initialData.cerFilename, base64: '' }
      : null,
  )
  const [keyFile, setKeyFile] = useState<CsdFile | null>(
    initialData?.hasCsd && initialData.keyFilename
      ? { name: initialData.keyFilename, base64: '' }
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
      clabe: initialData?.clabe ?? '',
      bankName: initialData?.bankName ?? '',
      paymentLink: initialData?.paymentLink ?? '',
      autoReminders: initialData?.autoReminders ?? false,
    },
  })

  // Only the regimes of the RFC's kind of person: a persona física with 601 fails its first stamp.
  const rfcValue = useWatch({ control: form.control, name: 'rfc' })
  const regimeOptions = useMemo(
    () => taxRegimes
      .filter((r) => regimeFitsRfc(r, rfcValue))
      .map((r) => ({ value: r.value, hint: r.value, label: r.label.replace(/^\d+\s*-\s*/, '') })),
    [taxRegimes, rfcValue],
  )

  /** Whether the régimen fits the RFC; a code missing from the catalog is left to the schema. */
  const regimeFits = (code: string, rfc: string) => {
    const regime = taxRegimes.find((r) => r.value === code)
    return !regime || regimeFitsRfc(regime, rfc)
  }

  /** A régimen picked before the RFC may not fit it once typed: it is dropped so the user picks again. */
  const dropUnfittingRegime = (rfc: string) => {
    if (!regimeFits(form.getValues('taxRegime'), rfc)) form.setValue('taxRegime', '')
  }

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
    toast.success('Datos tomados de la constancia', { description: 'Revísalos antes de guardar.' })
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (values: IssuingProfileFormValues) => {
    // A profile saved before the filter may carry a régimen that does not fit its RFC.
    if (!regimeFits(values.taxRegime, values.rfc)) {
      form.setError('taxRegime', { message: 'Ese régimen no aplica a tu tipo de persona: elige otro.' })
      return
    }

    // Only newly selected files carry base64; a stored CSD is kept as is.
    const newCer = cerFile?.base64 ? cerFile : null
    const newKey = keyFile?.base64 ? keyFile : null

    if ((newCer || newKey) && !(newCer && newKey && keyPassword)) {
      toast.error('Faltan datos del CSD', { description: 'Para cambiar tu CSD sube el .cer, el .key y escribe su contraseña.' })
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
        ...(showPaymentDetails
          ? {
              clabe: values.clabe || null,
              bankName: values.bankName || null,
              paymentLink: values.paymentLink || null,
              autoReminders: values.autoReminders,
            }
          : {}),
        ...(newCer && newKey && keyPassword
          ? {
              cerFilename: newCer.name,
              cerBase64: newCer.base64,
              keyFilename: newKey.name,
              keyBase64: newKey.base64,
              keyPassword,
            }
          : {}),
      }
      await onSubmit(input)
    } catch (err) {
      toast.error('No se pudo guardar el perfil', { description: err instanceof Error ? err.message : 'Inténtalo de nuevo.' })
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
                    placeholder="PEGA850101AB3"
                    className="font-mono tracking-wide"
                    autoComplete="off"
                    onChange={(e) => {
                      const rfc = e.target.value.toUpperCase().trim()
                      field.onChange(rfc)
                      dropUnfittingRegime(rfc)
                    }}
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
                <FormLabel>Nombre o razón social</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Como aparece en tu constancia" />
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
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Régimen fiscal</FormLabel>
                <Combobox
                  options={regimeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Elige tu régimen"
                  searchPlaceholder="Busca por clave o nombre"
                  emptyText="Ningún régimen coincide"
                  aria-invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código postal fiscal</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="76000" maxLength={5} inputMode="numeric" className="font-mono" />
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
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="tu@correo.mx" />
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
                  Teléfono <span className="text-[12px] font-normal text-tinta-tenue">opcional</span>
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="442 123 4567" inputMode="tel" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showPaymentDetails && <PaymentDetailsFields form={form} />}

        {/* Logo */}
        <div>
          <SectionLabel className="mb-3">
            Logo <span className="font-normal">· opcional</span>
          </SectionLabel>
          <ImageUpload
            value={logoPreviewUrl ?? null}
            onChange={setLogoFile}
            placeholder="Sube el logo de tu empresa"
            maxSizeMB={2}
          />
          <p className="mt-1.5 text-[12px] text-tinta-tenue">
            Aparece en el PDF de tus facturas. Mejor si es cuadrado y con fondo transparente.
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
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitLabel ?? (initialData ? 'Guardar cambios' : 'Guardar perfil')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
