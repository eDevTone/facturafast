'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Loader2, Plus, ShieldCheck, ShieldOff, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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

import type { IssuingProfile } from '@features/fiscal-profile/types/fiscal-profile.types'
import { profileHasCSD } from '@features/fiscal-profile/types/fiscal-profile.types'
import type { CatalogOption } from '@shared/services/sat-catalog.service'
import { createInvoiceAction } from '../actions/create-invoice.action'
import { updateInvoiceAction } from '../actions/update-invoice.action'
import { createInvoiceFormSchema, type InvoiceFormData } from '../schemas/invoice-form.schema'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { calculateInvoiceTotals, formatCurrency } from '../utils/invoice-calculations'

interface InvoiceFormProps {
  clients: Array<{ id: string; businessName: string }>
  invoice?: InvoiceWithRelations
  catalogs: {
    paymentForms: CatalogOption[]
    paymentMethods: CatalogOption[]
    cfdiUsages: CatalogOption[]
  }
  profiles: IssuingProfile[]
  defaultProfileId?: string
}

export function InvoiceForm({ clients, invoice, catalogs, profiles, defaultProfileId }: InvoiceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!invoice

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          issuingProfileId: invoice.issuingProfileId || defaultProfileId || '',
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
          issuingProfileId: defaultProfileId || '',
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
  const selectedProfileId = form.watch('issuingProfileId')
  const selectedProfile = profiles.find(p => p.id === selectedProfileId)
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Emisor — Profile Picker */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Emisor
            </h2>
            <div className="mt-1 h-px bg-border/40" />
          </div>

          {profiles.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-warning/40 bg-warning/5 px-4 py-3">
              <Building2 className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Sin perfil fiscal</p>
                <p className="text-[12px] text-muted-foreground">
                  Configura un perfil fiscal antes de crear facturas.{' '}
                  <a href="/fiscal-profiles" className="text-primary hover:underline">Configurar</a>
                </p>
              </div>
            </div>
          ) : profiles.length === 1 ? (
            <>
              <input type="hidden" {...form.register('issuingProfileId')} />
              <ProfileDisplay profile={profiles[0]} />
            </>
          ) : (
            <FormField
              control={form.control}
              name="issuingProfileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil Fiscal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un perfil emisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-mono text-[13px]">{p.rfc}</span>
                          <span className="text-muted-foreground ml-2">— {p.businessName}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedProfile && <ProfileDisplay profile={selectedProfile} compact />}
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Main form card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-8">
          {/* Receptor */}
          <section className="space-y-4">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Receptor
              </h2>
              <div className="mt-1 h-px bg-border/40" />
            </div>

            {clients.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-warning/40 bg-warning/5 px-4 py-3">
                <Users className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sin clientes registrados</p>
                  <p className="text-[12px] text-muted-foreground">
                    Necesitas al menos un cliente para crear una factura.{' '}
                    <a href="/clients/new" className="text-primary hover:underline">Agregar cliente</a>
                  </p>
                </div>
              </div>
            ) : (
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
            )}
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
                        {catalogs.paymentForms.map(pf => (
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
                        {catalogs.paymentMethods.map(pm => (
                          <SelectItem key={pm.value} value={pm.value}>
                            {pm.label}
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
                        {catalogs.cfdiUsages.map(u => (
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

                    <div className="flex items-center justify-end h-9 px-3">
                      <span className="text-sm font-mono font-medium text-foreground">
                        {formatCurrency(amount)}
                      </span>
                    </div>

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
            <div className="ml-auto max-w-xs space-y-1.5 rounded-lg border border-border/40 bg-muted/30 p-4">
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
        </div>

        {/* Actions — fuera de la card */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(isEditing ? `/invoices/${invoice.id}` : '/invoices')}
            disabled={isSubmitting}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || profiles.length === 0 || clients.length === 0}>
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

function ProfileDisplay({ profile, compact }: { profile: IssuingProfile; compact?: boolean }) {
  const hasCSD = profileHasCSD(profile)

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-2 text-[12px] text-muted-foreground">
        <Building2 className="h-3 w-3" />
        {profile.businessName} · CP {profile.postalCode}
        {hasCSD ? (
          <span className="text-primary flex items-center gap-0.5"><ShieldCheck className="h-3 w-3" /> CSD</span>
        ) : (
          <span className="text-warning flex items-center gap-0.5"><ShieldOff className="h-3 w-3" /> Sin CSD</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/30 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Building2 className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{profile.rfc}</span>
          {hasCSD ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-primary">
              <ShieldCheck className="h-3 w-3" /> CSD listo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-warning">
              <ShieldOff className="h-3 w-3" /> Sin CSD
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground truncate">{profile.businessName}</p>
        <p className="text-[12px] text-muted-foreground/60">
          Régimen {profile.taxRegime} · CP {profile.postalCode}
        </p>
      </div>
    </div>
  )
}
