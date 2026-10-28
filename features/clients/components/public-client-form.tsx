'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { CfdiUsageOption, TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { Button } from '@shared/ui/button'
import { Combobox } from '@shared/ui/combobox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import { personTypeOfRfc, regimeFitsRfc } from '@shared/utils/rfc'
import { Check, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { extractCsfForRequestAction, submitClientDataAction } from '../actions/public-client-request.actions'
import { publicClientSchema, type PublicClientValues } from '../schemas/public-client.schema'
import { CSFUpload } from './csf-upload'

interface PublicClientFormProps {
  token: string
  /** The business that asks for the data. */
  businessName: string
  catalogs: { taxRegimes: TaxRegimeOption[]; cfdiUsages: CfdiUsageOption[] }
}

const DEFAULT_CFDI_USAGE = 'G03'

/** "Clave - Descripción" → the description, with the key as a hint. */
function toOptions(items: { value: string; label: string }[]) {
  return items.map((item) => ({ value: item.value, hint: item.value, label: item.label.replace(/^\w+\s*-\s*/, '') }))
}

/**
 * The page a client opens from "Pedir datos a un cliente": their fiscal data, typed or read from
 * their constancia. Régimen and uso CFDI only offer what fits the RFC typed.
 */
export function PublicClientForm({ token, businessName, catalogs }: PublicClientFormProps) {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<PublicClientValues>({
    resolver: zodResolver(publicClientSchema),
    defaultValues: { rfc: '', businessName: '', taxRegime: '', postalCode: '', cfdiUsage: DEFAULT_CFDI_USAGE, email: '', phone: '' },
  })

  const rfc = useWatch({ control: form.control, name: 'rfc' })
  const personType = personTypeOfRfc(rfc)
  const regimeOptions = useMemo(
    () => toOptions(catalogs.taxRegimes.filter((regime) => regimeFitsRfc(regime, rfc))),
    [catalogs.taxRegimes, rfc],
  )
  const usageOptions = useMemo(
    () => toOptions(personType
      ? catalogs.cfdiUsages.filter((usage) => (personType === 'moral' ? usage.applicableToMoral : usage.applicableToFisica))
      : catalogs.cfdiUsages),
    [catalogs.cfdiUsages, personType],
  )

  /** A régimen or uso picked before the RFC may not fit it once typed: they are dropped. */
  const dropUnfitting = (nextRfc: string) => {
    const type = personTypeOfRfc(nextRfc)
    const regime = catalogs.taxRegimes.find((item) => item.value === form.getValues('taxRegime'))
    if (regime && !regimeFitsRfc(regime, nextRfc)) form.setValue('taxRegime', '')
    const usage = catalogs.cfdiUsages.find((item) => item.value === form.getValues('cfdiUsage'))
    if (usage && type && !(type === 'moral' ? usage.applicableToMoral : usage.applicableToFisica)) {
      form.setValue('cfdiUsage', DEFAULT_CFDI_USAGE)
    }
  }

  const handleCsf = (data: { rfc: string; businessName: string; taxRegime?: string | null; postalCode: string }) => {
    form.setValue('rfc', data.rfc.toUpperCase(), { shouldDirty: true })
    form.setValue('businessName', data.businessName, { shouldDirty: true })
    form.setValue('postalCode', data.postalCode, { shouldDirty: true })
    if (data.taxRegime) form.setValue('taxRegime', data.taxRegime, { shouldDirty: true })
    dropUnfitting(data.rfc)
    toast.success('Datos tomados de tu constancia', { description: 'Revísalos y escribe tu correo.' })
  }

  const handleSubmit = async (values: PublicClientValues) => {
    setSubmitting(true)
    const result = await submitClientDataAction(token, values)
    setSubmitting(false)
    if (!result.success) {
      toast.error('No se guardaron tus datos', { description: result.error })
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="hoja px-6 py-10 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sello-tenue text-sello">
          <Check className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-base font-semibold">Listo, {businessName} ya tiene tus datos</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta-tenue">
          Tus facturas te llegarán al correo que escribiste. Ya puedes cerrar esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="hoja space-y-6 px-5 py-6 sm:px-7">
      <div className="space-y-2">
        <CSFUpload extract={(formData) => extractCsfForRequestAction(token, formData)} onDataExtracted={handleCsf} />
        <p className="text-[12px] text-tinta-tenue">La constancia es opcional: el SAT no la pide para facturar.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <FormField
              control={form.control}
              name="rfc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RFC</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      maxLength={13}
                      placeholder="EKU9003173C9"
                      className="font-mono tracking-wide"
                      onChange={(e) => {
                        const next = e.target.value.toUpperCase().trim()
                        field.onChange(next)
                        dropUnfitting(next)
                      }}
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
                    <Input {...field} placeholder="Como aparece en tu constancia, sin «S.A. de C.V.»" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
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
                  <FormLabel>Código postal</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" maxLength={5} placeholder="76000" className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="cfdiUsage"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Uso del CFDI</FormLabel>
                <Combobox
                  options={usageOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Elige el uso"
                  searchPlaceholder="Busca por clave o nombre"
                  emptyText="Ningún uso coincide"
                  aria-invalid={!!fieldState.error}
                />
                <p className="text-[12px] text-tinta-tenue">Si no lo sabes, «Gastos en general» es el más común.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo para recibir tus facturas</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" inputMode="email" autoComplete="email" placeholder="facturas@tuempresa.mx" />
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
                    <Input {...field} value={field.value ?? ''} inputMode="tel" autoComplete="tel" placeholder="442 123 4567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Enviar mis datos
          </Button>
        </form>
      </Form>
    </div>
  )
}
