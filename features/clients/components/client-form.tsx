'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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

import { CSFUpload } from './csf-upload'
import { createClientAction } from '../actions/create-client.action'
import { createClientFormSchema, type ClientFormData } from '../schemas/client-form.schema'

const TAX_REGIMES = [
  { value: '601', label: '601 - General de Ley Personas Morales' },
  { value: '603', label: '603 - Personas Morales con Fines no Lucrativos' },
  { value: '605', label: '605 - Sueldos y Salarios e Ingresos Asimilados' },
  { value: '606', label: '606 - Arrendamiento' },
  { value: '608', label: '608 - Demás ingresos' },
  { value: '610', label: '610 - Residentes en el Extranjero' },
  { value: '611', label: '611 - Ingresos por Dividendos' },
  { value: '612', label: '612 - Personas Físicas con Actividades Empresariales' },
  { value: '614', label: '614 - Ingresos por intereses' },
  { value: '615', label: '615 - Régimen de los ingresos por obtención de premios' },
  { value: '616', label: '616 - Sin obligaciones fiscales' },
  { value: '621', label: '621 - Incorporación Fiscal' },
  { value: '625', label: '625 - Actividades Empresariales con Plataformas Tecnológicas' },
  { value: '626', label: '626 - Régimen Simplificado de Confianza' },
] as const

const CFDI_USAGES = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'I04', label: 'I04 - Equipo de cómputo y accesorios' },
  { value: 'I05', label: 'I05 - Dados, troqueles, moldes, matrices' },
  { value: 'I06', label: 'I06 - Comunicaciones telefónicas' },
  { value: 'I07', label: 'I07 - Comunicaciones satelitales' },
  { value: 'I08', label: 'I08 - Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 - Honorarios médicos y gastos hospitalarios' },
  { value: 'D02', label: 'D02 - Gastos médicos por incapacidad' },
  { value: 'D03', label: 'D03 - Gastos funerales' },
  { value: 'D04', label: 'D04 - Donativos' },
  { value: 'D05', label: 'D05 - Intereses reales por créditos hipotecarios' },
  { value: 'D06', label: 'D06 - Aportaciones voluntarias al SAR' },
  { value: 'D07', label: 'D07 - Primas por seguros de gastos médicos' },
  { value: 'D08', label: 'D08 - Gastos de transportación escolar' },
  { value: 'D09', label: 'D09 - Depósitos en cuentas para el ahorro' },
  { value: 'D10', label: 'D10 - Pagos por servicios educativos' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
  { value: 'P01', label: 'P01 - Por definir' },
  { value: 'CP01', label: 'CP01 - Pagos' },
  { value: 'CN01', label: 'CN01 - Nómina' },
] as const

export function ClientForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientFormData>({
    resolver: zodResolver(createClientFormSchema),
    defaultValues: {
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

    const toastId = toast.loading('Creando cliente...')

    try {
      const result = await createClientAction(data)

      if (result.success) {
        toast.success('Cliente creado exitosamente', {
          id: toastId,
          description: `RFC: ${data.rfc}`
        })

        router.push('/clients')
        router.refresh()
        form.reset()
      } else {
        toast.error('Error al crear cliente', {
          id: toastId,
          description: result.error || 'Intenta de nuevo'
        })
      }
    } catch (error) {
      console.error('Form error:', error)
      toast.error('Error inesperado', {
        id: toastId,
        description: 'No se pudo crear el cliente'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* CSF Upload */}
        <CSFUpload onDataExtracted={handleCSFData} />

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
                    {TAX_REGIMES.map(regime => (
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
                    {CFDI_USAGES.map(usage => (
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/clients')}
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
              'Guardar Cliente'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
