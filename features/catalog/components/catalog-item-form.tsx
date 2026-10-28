'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/button'
import { Combobox, type ComboboxOption } from '@shared/ui/combobox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { catalogItemSchema, type CatalogItemFormData } from '../schemas/catalog-item.schema'

/** "Unidad de servicio": what a freelancer bills. */
const DEFAULT_UNIT = 'E48'

interface CatalogItemFormProps {
  defaultValues?: CatalogItemFormData
  productOptions: ComboboxOption[]
  unitOptions: ComboboxOption[]
  onSubmit: (data: CatalogItemFormData) => Promise<{ success: boolean }>
  submitLabel: string
  onCancel: () => void
}

/** A saved service: description, SAT keys and the price before IVA (optional). */
export function CatalogItemForm({ defaultValues, productOptions, unitOptions, onSubmit, submitLabel, onCancel }: CatalogItemFormProps) {
  const form = useForm<CatalogItemFormData>({
    resolver: zodResolver(catalogItemSchema),
    defaultValues: defaultValues ?? { description: '', productServiceCode: '', unit: DEFAULT_UNIT, unitPrice: null },
  })
  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(async (data) => { await onSubmit(data) })} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Diseño de identidad visual" autoFocus {...field} />
              </FormControl>
              <p className="text-[12px] text-tinta-tenue">Así aparece en la factura.</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productServiceCode"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Clave SAT del producto o servicio</FormLabel>
              <Combobox
                options={productOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Busca o escribe la clave"
                searchPlaceholder="Clave de 8 dígitos o descripción"
                emptyText="Escribe la clave de 8 dígitos del catálogo del SAT"
                allowCustom={(search) => (/^\d{8}$/.test(search.trim()) ? search.trim() : null)}
                aria-invalid={!!fieldState.error}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="unit"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Combobox
                  options={unitOptions}
                  value={field.value}
                  onChange={field.onChange}
                  searchPlaceholder="Buscar unidad"
                  aria-invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Precio sin IVA
                  <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="text-right font-mono"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                  />
                </FormControl>
                <p className="text-[12px] text-tinta-tenue">Déjalo vacío si cambia en cada factura.</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
