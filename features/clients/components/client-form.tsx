'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { SectionLabel } from '@shared/components/section-label'
import { Button } from '@shared/ui/button'
import { Combobox } from '@shared/ui/combobox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form'
import { Input } from '@shared/ui/input'

import type { CatalogOption, CountryOption, TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { toComboboxOptions } from '@shared/utils/catalog-options'
import { regimeFitsRfc } from '@shared/utils/rfc'
import { MAX_PAYMENT_TERMS_DAYS } from '@features/collections/utils/due-date'
import { createClientAction } from '../actions/create-client.action'
import { createClientFormSchema, type ClientFormData } from '../schemas/client-form.schema'
import { foreignTaxIdMatches, normalizeForeignTaxId } from '../utils/foreign-client'
import { CSFUpload } from './csf-upload'

/** Uso CFDI applied when the client has none: "Gastos en general" (P01 no longer exists in CFDI 4.0). */
const DEFAULT_CFDI_USAGE = 'G03'

export interface CreatedClient {
  id: string
  businessName: string
  rfc: string
  cfdiUsage: string | null
}

interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>
  /** Custom submit (edit mode). The form shows the success/error toast; the caller only reacts. */
  onSubmit?: (data: ClientFormData) => Promise<{ success: boolean; error?: string }>
  /** Create mode inside another screen (e.g. a dialog in the invoice form): called instead of navigating. */
  onCreated?: (client: CreatedClient) => void
  onCancel?: () => void
  submitLabel?: string
  showCSFUpload?: boolean
  catalogs: {
    taxRegimes: TaxRegimeOption[]
    cfdiUsages: CatalogOption[]
    countries: CountryOption[]
  }
}

/** What a 9-digit tax id is called in each country that uses one. */
const NINE_DIGIT_IDS: Record<string, string> = {
  USA: 'su EIN (o SSN), 9 dígitos sin guiones',
  CAN: 'su Business Number, 9 dígitos',
}

export function ClientForm({
  defaultValues,
  onSubmit: customOnSubmit,
  onCreated,
  onCancel,
  submitLabel = 'Guardar cliente',
  showCSFUpload = true,
  catalogs,
}: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!defaultValues

  const form = useForm<ClientFormData>({
    resolver: zodResolver(createClientFormSchema),
    defaultValues: {
      isForeign: false,
      rfc: '',
      businessName: '',
      email: '',
      phone: '',
      postalCode: '',
      taxRegime: '',
      country: '',
      foreignTaxId: '',
      paymentTermsDays: null,
      ...defaultValues,
      cfdiUsage: defaultValues?.cfdiUsage || DEFAULT_CFDI_USAGE,
    },
  })

  const isForeign = useWatch({ control: form.control, name: 'isForeign' })
  const country = useWatch({ control: form.control, name: 'country' })
  const countryOptions = useMemo(() => toComboboxOptions(catalogs.countries), [catalogs.countries])
  const taxIdFormat = catalogs.countries.find(c => c.value === country)?.taxIdFormat ?? null

  // Watch RFC to determine person type and filter tax regimes and CFDI usages
  const rfcValue = useWatch({ control: form.control, name: 'rfc' })
  const personType = rfcValue?.length === 12 ? 'moral' : rfcValue?.length === 13 ? 'fisica' : null

  const regimeOptions = useMemo(() => {
    const regimes = personType
      ? catalogs.taxRegimes.filter(r => (personType === 'moral' ? r.applicableToMoral : r.applicableToFisica))
      : catalogs.taxRegimes
    return regimes.map(r => ({ value: r.value, hint: r.value, label: r.label.replace(/^\d+\s*-\s*/, '') }))
  }, [catalogs.taxRegimes, personType])

  /** A régimen picked before the RFC may not fit it once typed: it is dropped so the user picks again. */
  const dropUnfittingRegime = (rfc: string) => {
    const regime = catalogs.taxRegimes.find(r => r.value === form.getValues('taxRegime'))
    if (regime && !regimeFitsRfc(regime, rfc)) form.setValue('taxRegime', '')
  }

  const usageOptions = useMemo(
    () => catalogs.cfdiUsages.map(u => ({ value: u.value, hint: u.value, label: u.label.replace(/^\w+\s*-\s*/, '') })),
    [catalogs.cfdiUsages],
  )

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

    toast.success('Datos tomados de la constancia', {
      description: 'Revísalos y completa lo que falte.'
    })
  }

  async function onSubmit(input: ClientFormData) {
    let data = input
    // NumRegIdTrib must follow the pattern c_Pais gives the country (CFDI40156).
    if (data.isForeign && data.foreignTaxId) {
      const foreignTaxId = normalizeForeignTaxId(data.foreignTaxId)
      if (!foreignTaxIdMatches(foreignTaxId, taxIdFormat)) {
        form.setError('foreignTaxId', {
          message: taxIdFormat === '[0-9]{9}' ? 'Lleva 9 dígitos, sin guiones' : 'No tiene el formato que el SAT pide para ese país',
        })
        return
      }
      data = { ...data, foreignTaxId }
    }

    setIsSubmitting(true)

    const toastId = toast.loading(isEditing ? 'Guardando cambios…' : 'Guardando cliente…')

    try {
      if (customOnSubmit) {
        const result = await customOnSubmit(data)
        if (result.success) {
          toast.success('Cliente actualizado', { id: toastId })
        } else {
          toast.error('No se guardaron los cambios', {
            id: toastId,
            description: result.error || 'Revisa los datos e inténtalo de nuevo.',
          })
        }
        return
      }

      const result = await createClientAction(data)
      if (!result.success || !('data' in result) || !result.data) {
        toast.error('No se pudo guardar el cliente', {
          id: toastId,
          description: result.error || 'Revisa los datos e inténtalo de nuevo.',
        })
        return
      }

      toast.success('Cliente guardado', {
        id: toastId,
        description: data.isForeign ? data.businessName : `RFC ${data.rfc}`,
      })

      if (onCreated) {
        onCreated({
          id: result.data.id,
          businessName: result.data.businessName,
          rfc: result.data.rfc,
          cfdiUsage: result.data.cfdiUsage ?? null,
        })
        form.reset()
        return
      }

      router.push('/clients')
      router.refresh()
      form.reset()
    } catch (error) {
      console.error('Form error:', error)
      toast.error('No se pudo guardar el cliente', {
        id: toastId,
        description: 'Hubo un problema de conexión. Inténtalo de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {showCSFUpload && !isForeign && <CSFUpload onDataExtracted={handleCSFData} />}

        <div className="hoja space-y-8 p-5 sm:p-6">
          {/* Datos fiscales */}
          <section className="space-y-4">
            <SectionLabel
              action={
                <FormField
                  control={form.control}
                  name="isForeign"
                  render={({ field }) => (
                    <div className="flex items-center gap-1 text-[13px]" role="radiogroup" aria-label="Dónde reside el cliente">
                      {([
                        [false, 'En México'],
                        [true, 'En el extranjero'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={label}
                          type="button"
                          role="radio"
                          aria-checked={field.value === value}
                          onClick={() => {
                            field.onChange(value)
                            form.clearErrors()
                          }}
                          className={cn(
                            'whitespace-nowrap rounded-[4px] px-2 py-0.5 transition-colors',
                            field.value === value ? 'bg-sello-tenue font-medium text-tinta' : 'text-tinta-tenue hover:text-tinta',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              }
            >
              Datos fiscales
            </SectionLabel>

            {isForeign ? (
              <ForeignClientFields form={form} countryOptions={countryOptions} country={country} taxIdFormat={taxIdFormat} />
            ) : (
            <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>RFC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="EKU9003173C9"
                        className="font-mono tracking-wide"
                        autoComplete="off"
                        {...field}
                        onChange={e => {
                          const rfc = e.target.value.toUpperCase().trim()
                          field.onChange(rfc)
                          dropUnfittingRegime(rfc)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Código postal fiscal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="76000"
                        maxLength={5}
                        inputMode="numeric"
                        className="font-mono tracking-wide"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón social o nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Como aparece en su constancia, sin «SA de CV»" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxRegime"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>
                    Régimen fiscal
                    {personType && (
                      <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">
                        persona {personType === 'moral' ? 'moral' : 'física'}
                      </span>
                    )}
                  </FormLabel>
                  <Combobox
                    options={regimeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Elige el régimen"
                    searchPlaceholder="Busca por clave o nombre"
                    emptyText="Ningún régimen coincide"
                    aria-invalid={!!fieldState.error}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            </>
            )}
          </section>

          {/* Contacto */}
          <section className="space-y-4">
            <SectionLabel>Contacto</SectionLabel>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Correo
                      <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional, ahí le llegan sus facturas</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="facturas@cliente.mx" {...field} />
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
                      Teléfono
                      <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="442 123 4567" inputMode="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* Facturación: a client abroad always gets S01, so only the days of credit apply */}
          <section className="space-y-4">
            <SectionLabel>Facturación</SectionLabel>

            <div className={cn('grid grid-cols-1 gap-4', !isForeign && 'sm:grid-cols-[1fr_180px]')}>
              {!isForeign && (
                <FormField
                  control={form.control}
                  name="cfdiUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Uso del CFDI habitual
                        <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">se propone al facturarle</span>
                      </FormLabel>
                      <Combobox
                        options={usageOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Elige el uso"
                        searchPlaceholder="Busca por clave o nombre"
                        emptyText="Ningún uso coincide"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="paymentTermsDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Días de crédito
                      <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={MAX_PAYMENT_TERMS_DAYS}
                        step={1}
                        placeholder="30"
                        className="max-w-[120px] font-mono"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-[12px] text-tinta-tenue">Lo que tarda en pagarte. Con eso sabemos cuándo vence cada factura.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => (onCancel ? onCancel() : router.push('/clients'))}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}

/**
 * A client abroad: country (c_Pais), tax id (NumRegIdTrib), name, and the IVA it is charged.
 * RFC, CP, régimen and uso CFDI are the ones the SAT fixes (XEXX010101000, issuer's CP, 616, S01).
 */
function ForeignClientFields({
  form,
  countryOptions,
  country,
  taxIdFormat,
}: {
  form: ReturnType<typeof useForm<ClientFormData>>
  countryOptions: ReturnType<typeof toComboboxOptions>
  country: string | undefined
  taxIdFormat: string | null
}) {
  const taxIdHint = country && NINE_DIGIT_IDS[country]
    ? `Escribe ${NINE_DIGIT_IDS[country]}.`
    : taxIdFormat
      ? 'Con el formato que el SAT pide para ese país.'
      : 'Como lo usa en su país.'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <FormField
          control={form.control}
          name="country"
          render={({ field, fieldState }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>País</FormLabel>
              <Combobox
                options={countryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="¿Dónde reside?"
                searchPlaceholder="Busca el país"
                emptyText="Ningún país coincide"
                aria-invalid={!!fieldState.error}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="foreignTaxId"
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>
                Número de identificación fiscal
                <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="123456789" className="font-mono tracking-wide" autoComplete="off" {...field} />
              </FormControl>
              <p className="text-[12px] text-tinta-tenue">
                {taxIdHint} Si le facturas servicios de tecnología con IVA 0 %, la factura debe llevarlo.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="businessName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre o razón social</FormLabel>
            <FormControl>
              <Input placeholder="Acme Inc." {...field} />
            </FormControl>
            <p className="text-[12px] text-tinta-tenue">
              En la factura va con el RFC genérico XEXX010101000, como pide el SAT para los clientes del extranjero.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ivaRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>¿Le cobras IVA?</FormLabel>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="IVA que le cobras">
              {([
                ['0', '0 % · exportación de servicios'],
                ['0.16', '16 %'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={field.value === value}
                  onClick={() => field.onChange(value)}
                  className={cn(
                    'rounded-[4px] border px-3 py-1.5 text-[13px] transition-colors',
                    field.value === value
                      ? 'border-sello bg-sello-tenue font-medium text-tinta'
                      : 'border-renglon text-tinta-tenue hover:border-tinta-tenue/50 hover:text-tinta',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="max-w-prose text-[12px] leading-relaxed text-tinta-tenue">
              El 0 % aplica si tu cliente no tiene establecimiento en México, aprovecha todo el servicio fuera del país y
              te paga por transferencia o cheque desde una cuenta de un banco del extranjero (LIVA art. 29; RLIVA arts. 58
              y 61). Si te paga por PayPal, Wise o tarjeta, revísalo con tu contador. Si no se cumple, es 16 %.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
