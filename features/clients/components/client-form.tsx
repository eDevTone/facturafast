'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClientFormData>({
    resolver: zodResolver(createClientFormSchema),
  })

  const handleCSFData = (data: {
    rfc: string
    razonSocial: string
    regimenFiscal?: string
    codigoPostal: string
  }) => {
    // Auto-fill form fields with extracted data
    form.setValue('rfc', data.rfc)
    form.setValue('razonSocial', data.razonSocial)
    form.setValue('codigoPostal', data.codigoPostal)
    if (data.regimenFiscal) {
      form.setValue('regimenFiscal', data.regimenFiscal)
    }

    // Show success message
    alert('✅ Datos extraídos del CSF. Revisa y completa la información faltante.')
  }

  async function onSubmit(data: ClientFormData) {
    setIsSubmitting(true)
    try {
      const result = await createClientAction(data)

      if (result.success) {
        alert('Cliente creado exitosamente!')
        form.reset()
        // TODO: Router push a /clientes
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Form error:', error)
      alert('Error al crear cliente')
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
                    12 o 13 caracteres (RFC con homoclave)
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
                  <FormLabel>Razón Social *</FormLabel>
                  <FormControl>
                    <Input placeholder="Empresa SA de CV" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
                        placeholder="contacto@empresa.com"
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
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="601">601 - General</SelectItem>
                        <SelectItem value="603">603 - Personas Morales</SelectItem>
                        <SelectItem value="605">605 - Sueldos y Salarios</SelectItem>
                        <SelectItem value="606">606 - Arrendamiento</SelectItem>
                        <SelectItem value="612">612 - Personas Físicas</SelectItem>
                        <SelectItem value="616">616 - Sin obligaciones fiscales</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Uso CFDI</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="P01">P01 - Por definir</SelectItem>
                        <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                        <SelectItem value="D10">D10 - Pagos por servicios educativos</SelectItem>
                        <SelectItem value="S01">S01 - Sin efectos fiscales</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
