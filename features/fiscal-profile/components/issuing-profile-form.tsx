'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Upload, ShieldCheck, ShieldOff, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select'

import { TAX_REGIME_OPTIONS } from '../types/fiscal-profile.types'
import type { IssuingProfile, CreateIssuingProfileInput } from '../types/fiscal-profile.types'

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  rfc: z
    .string()
    .min(12, 'Mínimo 12 caracteres')
    .max(13, 'Máximo 13 caracteres')
    .regex(/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i, 'Formato RFC inválido'),
  businessName: z.string().min(3, 'Mínimo 3 caracteres'),
  taxRegime: z.string().min(1, 'Selecciona un régimen fiscal'),
  postalCode: z
    .string()
    .length(5, 'Debe tener 5 dígitos')
    .regex(/^[0-9]{5}$/, 'Solo números'),
  email: z.string().email('Correo inválido'),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface IssuingProfileFormProps {
  /** If provided, pre-fills the form for editing */
  initialData?: IssuingProfile | null
  onSubmit: (input: CreateIssuingProfileInput) => Promise<void>
  onCancel?: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IssuingProfileForm({
  initialData,
  onSubmit,
  onCancel,
}: IssuingProfileFormProps) {
  const [submitting, setSubmitting] = useState(false)

  // CSD file state
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
  const [keyPassword, setKeyPassword] = useState(initialData?.keyPassword ?? '')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rfc: initialData?.rfc ?? '',
      businessName: initialData?.businessName ?? '',
      taxRegime: initialData?.taxRegime ?? '',
      postalCode: initialData?.postalCode ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
    },
  })

  // ── File readers ────────────────────────────────────────────────────────────

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Strip data URL prefix if present
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

  const handleSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const input: CreateIssuingProfileInput = {
        rfc: values.rfc.toUpperCase(),
        businessName: values.businessName,
        taxRegime: values.taxRegime,
        postalCode: values.postalCode,
        email: values.email,
        phone: values.phone || undefined,
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
                    {TAX_REGIME_OPTIONS.map((opt) => (
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
                <div className="flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700 truncate flex-1">{cerFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCerFile(null)}
                    className="text-green-500 hover:text-green-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 hover:border-gray-400 transition-colors">
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
                <div className="flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs text-blue-700 truncate flex-1">{keyFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setKeyFile(null)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 hover:border-gray-400 transition-colors">
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

          {/* Password — only show when .key is uploaded */}
          {keyFile && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Contraseña del .key
              </label>
              <Input
                type="password"
                placeholder="Contraseña de la llave privada"
                value={keyPassword}
                onChange={(e) => setKeyPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                ⚠️ Se guardará localmente. Cifrado en producción.
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
            {initialData ? 'Guardar cambios' : 'Crear perfil'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
