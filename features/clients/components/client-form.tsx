'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { Button } from '@shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card'
import { Input } from '@shared/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
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

export function ClientForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientFormData>({
    resolver: zodResolver(createClientFormSchema),
    defaultValues: {
      rfc: '',
      razonSocial: '',
      email: '',
      telefono: '',
      codigoPostal: '',
      regimenFiscal: '',
      usoCfdi: '',
    },
  })

  const handleCSFData = (data: {
    rfc: string
    razonSocial: string
    regimenFiscal?: string | null
    codigoPostal: string
    email?: string
    usoCfdi?: string
  }) => {
    // Auto-fill form fields with extracted data
    form.setValue('rfc', data.rfc, { shouldDirty: true })
    form.setValue('razonSocial', data.razonSocial, { shouldDirty: true })
    form.setValue('codigoPostal', data.codigoPostal, { shouldDirty: true })
    if (data.regimenFiscal) {
      form.setValue('regimenFiscal', data.regimenFiscal, { shouldDirty: true })
    }
    if (data.email) {
      form.setValue('email', data.email, { shouldDirty: true })
    }
    if (data.usoCfdi) {
      form.setValue('usoCfdi', data.usoCfdi, { shouldDirty: true })
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
        
        // Reset form
        form.reset()
        
        // Redirect to clients list
        router.push('/clientes')
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* CSF Upload */}
        <CSFUpload onDataExtracted={handleCSFData} />

        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* RFC */}
            <FormField
              control={form.control}
              name="rfc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="XAXX010101000"
                      {...field}
                      onChange={e => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    12 caracteres (Persona Moral) o 13 (Persona Física)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Razón Social */}
            <FormField
              control={form.control}
              name="razonSocial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social / Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="EMPRESA EJEMPLO SA DE CV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="4421234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código Postal */}
            <FormField
              control={form.control}
              name="codigoPostal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código Postal *</FormLabel>
                  <FormControl>
                    <Input placeholder="76000" maxLength={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Régimen Fiscal */}
            <FormField
              control={form.control}
              name="regimenFiscal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Régimen Fiscal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona régimen fiscal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="601">
                        601 - General de Ley Personas Morales
                      </SelectItem>
                      <SelectItem value="603">
                        603 - Personas Morales con Fines no Lucrativos
                      </SelectItem>
                      <SelectItem value="605">
                        605 - Sueldos y Salarios e Ingresos Asimilados a Salarios
                      </SelectItem>
                      <SelectItem value="606">
                        606 - Arrendamiento
                      </SelectItem>
                      <SelectItem value="608">
                        608 - Demás ingresos
                      </SelectItem>
                      <SelectItem value="610">
                        610 - Residentes en el Extranjero
                      </SelectItem>
                      <SelectItem value="611">
                        611 - Ingresos por Dividendos
                      </SelectItem>
                      <SelectItem value="612">
                        612 - Personas Físicas con Actividades Empresariales
                      </SelectItem>
                      <SelectItem value="614">
                        614 - Ingresos por intereses
                      </SelectItem>
                      <SelectItem value="615">
                        615 - Régimen de los ingresos por obtención de premios
                      </SelectItem>
                      <SelectItem value="616">
                        616 - Sin obligaciones fiscales
                      </SelectItem>
                      <SelectItem value="621">
                        621 - Incorporación Fiscal
                      </SelectItem>
                      <SelectItem value="625">
                        625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas
                      </SelectItem>
                      <SelectItem value="626">
                        626 - Régimen Simplificado de Confianza
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Opcional - Se puede dejar vacío
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Uso CFDI */}
            <FormField
              control={form.control}
              name="usoCfdi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Uso CFDI *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona uso CFDI" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="P01">
                        P01 - Por definir
                      </SelectItem>
                      <SelectItem value="G01">
                        G01 - Adquisición de mercancias
                      </SelectItem>
                      <SelectItem value="G02">
                        G02 - Devoluciones, descuentos o bonificaciones
                      </SelectItem>
                      <SelectItem value="G03">
                        G03 - Gastos en general
                      </SelectItem>
                      <SelectItem value="I01">
                        I01 - Construcciones
                      </SelectItem>
                      <SelectItem value="I02">
                        I02 - Mobilario y equipo de oficina por inversiones
                      </SelectItem>
                      <SelectItem value="I03">
                        I03 - Equipo de transporte
                      </SelectItem>
                      <SelectItem value="I04">
                        I04 - Equipo de computo y accesorios
                      </SelectItem>
                      <SelectItem value="I05">
                        I05 - Dados, troqueles, moldes, matrices y herramental
                      </SelectItem>
                      <SelectItem value="I06">
                        I06 - Comunicaciones telefónicas
                      </SelectItem>
                      <SelectItem value="I07">
                        I07 - Comunicaciones satelitales
                      </SelectItem>
                      <SelectItem value="I08">
                        I08 - Otra maquinaria y equipo
                      </SelectItem>
                      <SelectItem value="D01">
                        D01 - Honorarios médicos, dentales y gastos hospitalarios
                      </SelectItem>
                      <SelectItem value="D02">
                        D02 - Gastos médicos por incapacidad o discapacidad
                      </SelectItem>
                      <SelectItem value="D03">
                        D03 - Gastos funerales
                      </SelectItem>
                      <SelectItem value="D04">
                        D04 - Donativos
                      </SelectItem>
                      <SelectItem value="D05">
                        D05 - Intereses reales efectivamente pagados por créditos hipotecarios
                      </SelectItem>
                      <SelectItem value="D06">
                        D06 - Aportaciones voluntarias al SAR
                      </SelectItem>
                      <SelectItem value="D07">
                        D07 - Primas por seguros de gastos médicos
                      </SelectItem>
                      <SelectItem value="D08">
                        D08 - Gastos de transportación escolar obligatoria
                      </SelectItem>
                      <SelectItem value="D09">
                        D09 - Depósitos en cuentas para el ahorro, primas
                      </SelectItem>
                      <SelectItem value="D10">
                        D10 - Pagos por servicios educativos (colegiaturas)
                      </SelectItem>
                      <SelectItem value="S01">
                        S01 - Sin efectos fiscales
                      </SelectItem>
                      <SelectItem value="CP01">
                        CP01 - Pagos
                      </SelectItem>
                      <SelectItem value="CN01">
                        CN01 - Nómina
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Uso que el cliente dará a la factura
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clientes')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
