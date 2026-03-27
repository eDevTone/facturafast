'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
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

import type { CatalogOption } from '@shared/services/sat-catalog.service'
import { createClientAction } from '../actions/create-client.action'
import { createClientFormSchema, type ClientFormData } from '../schemas/client-form.schema'
import { CSFUpload } from './csf-upload'

interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>
  onSubmit?: (formData: FormData) => Promise<any>
  onCancel?: () => void
  submitLabel?: string
  showCSFUpload?: boolean
  catalogs: {
    taxRegimes: CatalogOption[]
    cfdiUsages: CatalogOption[]
  }
}

export function ClientForm({
  defaultValues,
  onSubmit: customOnSubmit,
  onCancel,
  submitLabel = 'Guardar Cliente',
  showCSFUpload = true,
  catalogs,
}: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientFormData>({
    resolver: zodResolver(createClientFormSchema),
    defaultValues: defaultValues || {
      rfc: '',
      businessName: '',
      email: '',
      phone: '',
      postalCode: '',
      taxRegime: '',
      cfdiUsage: '',
    },
  })

  const handleCSFData = (data: {
    rfc: string
    businessName: string
    taxRegime?: string | null
    postalCode: string
    email?: string
    cfdiUsage?: string
  }) => {
    form.setValue('rfc', data.rfc, { shouldDirty: true })
    form.setValue('businessName', data.businessName, { shouldDirty: true })
    form.setValue('postalCode', data.postalCode, { shouldDirty: true })
    if (data.taxRegime) {
      form.setValue('taxRegime', data.taxRegime, { shouldDirty: true })
    }
    if (data.email) {
      form.setValue('email', data.email, { shouldDirty: true })
    }
    if (data.cfdiUsage) {
      form.setValue('cfdiUsage', data.cfdiUsage, { shouldDirty: true })
    }

    toast.success('Datos extraídos del CSF', {
      description: 'Revisa y completa la información faltante.'
    })
  }

  async function onSubmit(data: ClientFormData) {
    setIsSubmitting(true)

    const toastId = toast.loading(defaultValues ? 'Actualizando cliente...' : 'Creando cliente...')

    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value)
      })

      const result = customOnSubmit 
        ? await customOnSubmit(formData)
        : await createClientAction(data)

      if (result.success) {
        toast.success(defaultValues ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente', {
          id: toastId,
          description: `RFC: ${data.rfc}`
        })

        if (!customOnSubmit) {
          router.push('/clients')
          router.refresh()
          form.reset()
        }
      } else {
        toast.error(defaultValues ? 'Error al actualizar cliente' : 'Error al crear cliente', {
          id: toastId,
          description: result.error || 'Intenta de nuevo'
        })
      }
    } catch (error) {
      console.error('Form error:', error)
      toast.error('Error inesperado', {
        id: toastId,
        description: defaultValues ? 'No se pudo actualizar el cliente' : 'No se pudo crear el cliente'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* CSF Upload */}
        {showCSFUpload && <CSFUpload onDataExtracted={handleCSFData} />}

        {/* Main form card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-8">

        {/* Datos Fiscales */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Datos Fiscales
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>

          <div className="grid grid-cols-5 gap-4">
            {/* RFC */}
            <FormField
              control={form.control}
              name="rfc"
              render={({ field }) => (
                <FormItem className="col-span-3">
                  <FormLabel>RFC</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XAXX010101000"
                      className="font-mono tracking-wide"
                      {...field}
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código Postal */}
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Código Postal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="76000"
                      maxLength={5}
                      className="font-mono tracking-wide"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Razón Social */}
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razón Social / Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="EMPRESA EJEMPLO SA DE CV" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Régimen Fiscal */}
          <FormField
            control={form.control}
            name="taxRegime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Régimen Fiscal
                  <span className="ml-1.5 text-[11px] text-muted-foreground/50">opcional</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona régimen fiscal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {catalogs.taxRegimes.map(regime => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Contacto */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Contacto
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Email
                    <span className="ml-1.5 text-[11px] text-muted-foreground/50">opcional</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teléfono */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Teléfono
                    <span className="ml-1.5 text-[11px] text-muted-foreground/50">opcional</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="442 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Facturación */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Facturación
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>

          {/* Uso CFDI */}
          <FormField
            control={form.control}
            name="cfdiUsage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Uso CFDI
                  <span className="ml-1.5 text-[11px] text-muted-foreground/50">opcional</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona uso CFDI" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {catalogs.cfdiUsages.map(usage => (
                      <SelectItem key={usage.value} value={usage.value}>
                        {usage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        </div>{/* end main form card */}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onCancel ? onCancel() : router.push('/clients')}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
