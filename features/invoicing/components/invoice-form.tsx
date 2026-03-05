'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card'
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

import { createInvoiceAction } from '../actions/create-invoice.action'
import { createInvoiceFormSchema, type InvoiceFormData } from '../schemas/invoice-form.schema'
import { calculateInvoiceTotals, formatCurrency } from '../utils/invoice-calculations'

interface InvoiceFormProps {
  clients: Array<{ id: string; businessName: string }>
}

export function InvoiceForm({ clients }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      paymentMethod: 'PUE',
      cfdiUsage: 'P01',
      currency: 'MXN',
      items: [
        {
          productServiceCode: '84111506',
          description: '',
          quantity: 1,
          unit: 'E48',
          unitPrice: 0
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  // Watch items for totals calculation
  const items = form.watch('items')
  const { subtotal, iva, total } = calculateInvoiceTotals(items)

  async function onSubmit(data: InvoiceFormData) {
    setIsSubmitting(true)
    try {
      const result = await createInvoiceAction(data)

      if (result.success) {
        alert('Factura creada exitosamente!')
        // TODO: Router push a /invoices
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Form error:', error)
      alert('Error al crear factura')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Client & Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Client */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Serie */}
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serie (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="A, B, C..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Forma de Pago */}
              <FormField
                control={form.control}
                name="paymentForm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pago *</FormLabel>
                    <FormControl>
                      <Input placeholder="01, 02, 03..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Método de Pago */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUE">PUE - Pago en Una Exhibición</SelectItem>
                        <SelectItem value="PPD">PPD - Pago en Parcialidades</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Uso CFDI */}
              <FormField
                control={form.control}
                name="cfdiUsage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uso CFDI *</FormLabel>
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
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Conceptos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  productServiceCode: '84111506',
                  description: '',
                  quantity: 1,
                  unit: 'E48',
                  unitPrice: 0
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Concepto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium">Concepto {index + 1}</p>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-12 gap-4">
                  {/* Descripción */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="col-span-6">
                        <FormLabel>Descripción *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Cantidad */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Cantidad *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Valor Unitario */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Valor Unitario *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Importe (calculated) */}
                  <FormItem className="col-span-2">
                    <FormLabel>Importe</FormLabel>
                    <FormControl>
                      <Input
                        value={formatCurrency(items[index]?.quantity * items[index]?.unitPrice || 0)}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                  </FormItem>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (16%):</span>
                <span className="font-medium">{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                <span>Total:</span>
                <span className="text-accent">{formatCurrency(total)}</span>
              </div>
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
            className=""
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Borrador'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
