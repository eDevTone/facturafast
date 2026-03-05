'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'

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

import { createInvoiceAction } from '../actions/create-invoice.action'
import { updateInvoiceAction } from '../actions/update-invoice.action'
import { createInvoiceFormSchema, type InvoiceFormData } from '../schemas/invoice-form.schema'
import { calculateInvoiceTotals, formatCurrency } from '../utils/invoice-calculations'
import type { InvoiceWithRelations } from '../types/invoice.types'

const PAYMENT_FORMS = [
  { value: '01', label: '01 - Efectivo' },
  { value: '02', label: '02 - Cheque nominativo' },
  { value: '03', label: '03 - Transferencia electrónica' },
  { value: '04', label: '04 - Tarjeta de crédito' },
  { value: '05', label: '05 - Monedero electrónico' },
  { value: '06', label: '06 - Dinero electrónico' },
  { value: '08', label: '08 - Vales de despensa' },
  { value: '28', label: '28 - Tarjeta de débito' },
  { value: '29', label: '29 - Tarjeta de servicios' },
  { value: '99', label: '99 - Por definir' },
] as const

const CFDI_USAGES = [
  { value: 'G01', label: 'G01 - Adquisición de mercancías' },
  { value: 'G02', label: 'G02 - Devoluciones, descuentos o bonificaciones' },
  { value: 'G03', label: 'G03 - Gastos en general' },
  { value: 'I01', label: 'I01 - Construcciones' },
  { value: 'I02', label: 'I02 - Mobiliario y equipo de oficina' },
  { value: 'I03', label: 'I03 - Equipo de transporte' },
  { value: 'I04', label: 'I04 - Equipo de cómputo y accesorios' },
  { value: 'I08', label: 'I08 - Otra maquinaria y equipo' },
  { value: 'D01', label: 'D01 - Honorarios médicos y gastos hospitalarios' },
  { value: 'D10', label: 'D10 - Pagos por servicios educativos' },
  { value: 'S01', label: 'S01 - Sin efectos fiscales' },
  { value: 'P01', label: 'P01 - Por definir' },
  { value: 'CP01', label: 'CP01 - Pagos' },
] as const

interface InvoiceFormProps {
  clients: Array<{ id: string; businessName: string }>
  invoice?: InvoiceWithRelations
}

export function InvoiceForm({ clients, invoice }: InvoiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!invoice

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          serie: invoice.serie || '',
          paymentForm: invoice.paymentForm,
          paymentMethod: invoice.paymentMethod,
          cfdiUsage: invoice.cfdiUsage,
          currency: invoice.currency,
          items: invoice.items.map(item => ({
            productServiceCode: item.productServiceCode,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice),
          })),
        }
      : {
          paymentMethod: 'PUE',
          cfdiUsage: 'P01',
          currency: 'MXN',
          items: [
            {
              productServiceCode: '84111506',
              description: '',
              quantity: 1,
              unit: 'E48',
              unitPrice: 0,
            },
          ],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  })

  const items = form.watch('items')
  const { subtotal, iva, total } = calculateInvoiceTotals(items)

  async function onSubmit(data: InvoiceFormData) {
    setIsSubmitting(true)
    const toastId = toast.loading(isEditing ? 'Actualizando factura...' : 'Creando factura...')

    try {
      const result = isEditing
        ? await updateInvoiceAction(invoice.id, data)
        : await createInvoiceAction(data)

      if (result.success) {
        toast.success(isEditing ? 'Factura actualizada' : 'Factura creada exitosamente', { id: toastId })
        router.push(`/invoices/${result.invoiceId}`)
        router.refresh()
      } else {
        toast.error(isEditing ? 'Error al actualizar' : 'Error al crear factura', {
          id: toastId,
          description: result.error || 'Intenta de nuevo'
        })
      }
    } catch (error) {
      console.error('Form error:', error)
      toast.error('Error inesperado', {
        id: toastId,
        description: isEditing ? 'No se pudo actualizar la factura' : 'No se pudo crear la factura'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Cliente y Serie */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Receptor
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
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

            <FormField
              control={form.control}
              name="serie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Serie
                    <span className="ml-1.5 text-[11px] text-muted-foreground/50">opcional</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="A" className="font-mono" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Datos de Pago */}
        <section className="space-y-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Datos de Pago
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="paymentForm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_FORMS.map(pf => (
                        <SelectItem key={pf.value} value={pf.value}>
                          {pf.label}
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
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pago</FormLabel>
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

            <FormField
              control={form.control}
              name="cfdiUsage"
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
                      {CFDI_USAGES.map(u => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Conceptos */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Conceptos
              </h2>
              <div className="mt-1 h-px bg-border/40" />
            </div>
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
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Agregar
            </Button>
          </div>

          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[1fr_80px_120px_120px_32px] gap-3 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Descripción
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Cant.
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              P. Unitario
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 text-right">
              Importe
            </span>
            <span />
          </div>

          <div className="space-y-2">
            {fields.map((field, index) => {
              const qty = items[index]?.quantity || 0
              const price = items[index]?.unitPrice || 0
              const amount = qty * price

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_80px_120px_120px_32px] gap-3 items-start rounded-lg border border-border/40 bg-muted/20 p-3 md:border-0 md:bg-transparent md:p-0 md:rounded-none"
                >
                  {/* Descripción */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Descripción del servicio o producto" {...field} />
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
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="font-mono text-right"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Precio Unitario */}
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="font-mono text-right"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Importe */}
                  <div className="flex items-center justify-end h-9 px-3">
                    <span className="text-sm font-mono font-medium text-foreground">
                      {formatCurrency(amount)}
                    </span>
                  </div>

                  {/* Remove */}
                  <div className="flex items-center justify-center h-9">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Totales */}
        <section>
          <div className="ml-auto max-w-xs space-y-1.5 rounded-xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">IVA 16%</span>
              <span className="font-mono font-medium">{formatCurrency(iva)}</span>
            </div>
            <div className="h-px bg-border/40 my-1" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-lg font-mono font-bold text-primary">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(isEditing ? `/invoices/${invoice.id}` : '/invoices')}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Actualizando...' : 'Guardando...'}
              </>
            ) : (
              isEditing ? 'Guardar Cambios' : 'Guardar Borrador'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
