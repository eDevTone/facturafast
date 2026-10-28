'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { BookmarkPlus, Loader2, Plus, Trash2, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { SectionLabel } from '@shared/components/section-label'
import { Button } from '@shared/ui/button'
import { Combobox, type ComboboxOption } from '@shared/ui/combobox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/ui/form'
import { Input } from '@shared/ui/input'

import { saveConceptToCatalogAction } from '@features/catalog/actions/save-concept-to-catalog.action'
import { CatalogPicker } from '@features/catalog/components/catalog-picker'
import type { CatalogItem } from '@features/catalog/types/catalog.types'
import { priceForCatalog, priceForInvoice } from '@features/catalog/utils/catalog-price'
import { createClientAction } from '@features/clients/actions/create-client.action'
import { FOREIGN_CFDI_USAGE, isForeignClient, ivaRateChoice } from '@features/clients/utils/foreign-client'
import { getDofRateAction } from '@features/exchange-rates/actions/get-dof-rate.action'
import { MAX_PAYMENT_TERMS_DAYS } from '@features/collections/utils/due-date'
import { formatDayLong } from '@features/payments/utils/payment-dates'
import { updateRecurringTemplateAction } from '@features/recurring/actions/recurring.actions'
import { addDays, endOfMonth } from '@shared/utils/day'
import { ClientForm } from '@features/clients/components/client-form'
import type { ClientFormData } from '@features/clients/schemas/client-form.schema'
import type { Client } from '@features/clients/types/client.types'
import type { PublicIssuingProfile } from '@features/fiscal-profile/types/fiscal-profile.types'
import type { CatalogOption, CfdiUsageOption, CountryOption, TaxRegimeOption } from '@shared/services/sat-catalog.service'
import { toComboboxOptions } from '@shared/utils/catalog-options'
import { createInvoiceAction } from '../actions/create-invoice.action'
import { updateInvoiceAction } from '../actions/update-invoice.action'
import { createInvoiceFormSchema, type InvoiceFormData } from '../schemas/invoice-form.schema'
import type { InvoiceWithRelations, RelatedInvoice } from '../types/invoice.types'
import {
  computeCfdiAmounts,
  ISR_HONORARIOS_RATE,
  ISR_RESICO_RATE,
  IVA_RATE,
  IVA_WITHHOLDING_RATE,
  round2,
  suggestWithholdings,
} from '../utils/cfdi-amounts'
import { formatCurrency } from '../utils/invoice-calculations'
import { Folio } from './folio'

interface InvoiceFormProps {
  clients: Client[]
  invoice?: InvoiceWithRelations
  catalogs: {
    paymentForms: CatalogOption[]
    paymentMethods: CatalogOption[]
    cfdiUsages: CfdiUsageOption[]
    productServiceCodes: CatalogOption[]
    unitCodes: CatalogOption[]
  }
  clientCatalogs: {
    taxRegimes: TaxRegimeOption[]
    cfdiUsages: CatalogOption[]
    countries: CountryOption[]
  }
  profiles: PublicIssuingProfile[]
  defaultProfileId?: string
  /** Pre-selects a client, e.g. from "Facturar" in the client list. */
  initialClientId?: string
  /** The invoice this draft corrects ("Corregir factura"). */
  replaces?: RelatedInvoice
  /** "Mis servicios", to fill a line in one click. */
  catalogItems?: CatalogItem[]
  /** Today in Mexico City, YYYY-MM-DD: the due date shown is counted from it. */
  today: string
  /** "Cambiar conceptos" of a recurring invoice: the form edits its template, not an invoice. */
  template?: { id: string; values: InvoiceFormData }
}

const DEFAULT_UNIT = 'E48'
const DEFAULT_CFDI_USAGE = 'G03'
const PAYMENT_FORM_TO_BE_DEFINED = '99'

const emptyItem = (productServiceCode = '') => ({
  productServiceCode,
  description: '',
  quantity: 1,
  unit: DEFAULT_UNIT,
  unitPrice: 0,
})

/** Today in Mexico City, YYYY-MM-DD (en-CA writes dates that way). */
function todayInMexicoCity() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}

/** The IVA a client is charged: what it was given when saved, 16 % otherwise. */
function clientIvaRate(client: Client | undefined): number {
  return ivaRateChoice(client?.ivaRate) === '0' ? 0 : IVA_RATE
}

function percent(rate: number) {
  return `${(rate * 100).toLocaleString('es-MX', { maximumFractionDigits: 2 })} %`
}

export function InvoiceForm({
  clients: initialClients,
  invoice,
  catalogs,
  clientCatalogs,
  profiles,
  defaultProfileId,
  initialClientId,
  replaces,
  catalogItems = [],
  today,
  template,
}: InvoiceFormProps) {
  const router = useRouter()
  const isEditing = !!invoice
  const [clients, setClients] = useState(initialClients)
  const [submitting, setSubmitting] = useState<'draft' | 'stamp' | null>(null)
  const [newClientOpen, setNewClientOpen] = useState(false)
  const [catalog, setCatalog] = useState(catalogItems)
  const [savingConcept, setSavingConcept] = useState<number | null>(null)
  // Once the user changes a withholding by hand, picking another client stops overriding it.
  const [withholdingsTouched, setWithholdingsTouched] = useState(isEditing || !!template)

  const profileId = template?.values.issuingProfileId || invoice?.issuingProfileId || defaultProfileId || profiles[0]?.id || ''
  const startClient = clients.find((c) => c.id === (template?.values.clientId ?? invoice?.clientId ?? initialClientId))
  const startProfile = profiles.find((p) => p.id === profileId)
  const startSuggestion = suggestWithholdings(startProfile, startClient?.rfc)

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: template
      ? template.values
      : invoice
      ? {
          clientId: invoice.clientId,
          issuingProfileId: profileId,
          serie: invoice.serie || '',
          paymentForm: invoice.paymentForm,
          paymentMethod: invoice.paymentMethod as 'PUE' | 'PPD',
          cfdiUsage: invoice.cfdiUsage === 'P01' ? DEFAULT_CFDI_USAGE : invoice.cfdiUsage,
          currency: invoice.currency === 'USD' ? 'USD' : 'MXN',
          exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : null,
          exchangeRateSource: invoice.exchangeRateSource === 'dof' ? 'dof' : invoice.exchangeRate ? 'manual' : null,
          ivaRate: Number(invoice.ivaRate),
          pricesIncludeIva: invoice.pricesIncludeIva,
          isrWithholdingRate: invoice.isrWithholdingRate ? Number(invoice.isrWithholdingRate) : null,
          ivaWithholdingRate: invoice.ivaWithholdingRate ? Number(invoice.ivaWithholdingRate) : null,
          paymentTermsDays: invoice.paymentTermsDays,
          items: invoice.items.map((item) => ({
            productServiceCode: item.productServiceCode,
            description: item.description,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            unitPrice: parseFloat(item.unitPrice),
          })),
        }
      : {
          clientId: startClient?.id ?? '',
          issuingProfileId: profileId,
          serie: '',
          paymentForm: '',
          paymentMethod: 'PUE',
          cfdiUsage: startClient && isForeignClient(startClient)
            ? FOREIGN_CFDI_USAGE
            : startClient?.cfdiUsage && startClient.cfdiUsage !== 'P01' ? startClient.cfdiUsage : DEFAULT_CFDI_USAGE,
          // A client abroad pays in dollars; the rate is typed or fetched when the currency is picked.
          currency: 'MXN',
          exchangeRate: null,
          exchangeRateSource: null,
          ivaRate: clientIvaRate(startClient),
          // Freelancers quote honorarios before IVA.
          pricesIncludeIva: false,
          ...(startClient && isForeignClient(startClient) ? { isrWithholdingRate: null, ivaWithholdingRate: null } : startSuggestion),
          paymentTermsDays: startClient?.paymentTermsDays ?? null,
          items: [emptyItem()],
        },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const items = useWatch({ control: form.control, name: 'items' })
  const selectedProfileId = useWatch({ control: form.control, name: 'issuingProfileId' })
  const selectedClientId = useWatch({ control: form.control, name: 'clientId' })
  const pricesIncludeIva = useWatch({ control: form.control, name: 'pricesIncludeIva' })
  const isrRate = useWatch({ control: form.control, name: 'isrWithholdingRate' })
  const ivaRetRate = useWatch({ control: form.control, name: 'ivaWithholdingRate' })
  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' })
  const currency = useWatch({ control: form.control, name: 'currency' })
  const exchangeRate = useWatch({ control: form.control, name: 'exchangeRate' })
  const exchangeRateSource = useWatch({ control: form.control, name: 'exchangeRateSource' })
  const ivaRate = useWatch({ control: form.control, name: 'ivaRate' })
  const paymentTermsDays = useWatch({ control: form.control, name: 'paymentTermsDays' })
  const [rateStatus, setRateStatus] = useState<'idle' | 'loading' | 'unavailable'>('idle')

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId)
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const receptorIsMoral = selectedClient ? selectedClient.rfc.length === 12 : null
  const clientIsForeign = !!selectedClient && isForeignClient(selectedClient)
  const countryNames = useMemo(
    () => new Map(clientCatalogs.countries.map((c) => [c.value, c.label.replace(/^\w+\s*-\s*/, '')])),
    [clientCatalogs.countries],
  )

  const amounts = computeCfdiAmounts(items ?? [], {
    pricesIncludeIva,
    ivaRate,
    isrWithholdingRate: isrRate,
    ivaWithholdingRate: ivaRetRate,
  })

  const clientOptions = useMemo<ComboboxOption[]>(
    () => clients.map((c) => ({ value: c.id, label: c.businessName, hint: c.rfc })),
    [clients],
  )
  const profileOptions = useMemo<ComboboxOption[]>(
    () => profiles.map((p) => ({ value: p.id, label: p.businessName, hint: p.rfc })),
    [profiles],
  )
  const paymentFormOptions = useMemo(() => toComboboxOptions(catalogs.paymentForms), [catalogs.paymentForms])
  const productOptions = useMemo(() => toComboboxOptions(catalogs.productServiceCodes), [catalogs.productServiceCodes])
  const unitOptions = useMemo(() => toComboboxOptions(catalogs.unitCodes), [catalogs.unitCodes])
  const cfdiUsageOptions = useMemo(() => {
    const filtered = receptorIsMoral === null
      ? catalogs.cfdiUsages
      : catalogs.cfdiUsages.filter((u) => (receptorIsMoral ? u.applicableToMoral : u.applicableToFisica))
    return toComboboxOptions(filtered)
  }, [catalogs.cfdiUsages, receptorIsMoral])

  const dueIfToday = paymentTermsDays === null || paymentTermsDays === undefined ? null : addDays(today, paymentTermsDays)
  const monthEnd = endOfMonth(today)
  // RMF 2.7.1.39: a PUE has to be paid by the end of the month it is issued.
  const pueAfterMonthEnd = paymentMethod === 'PUE' && dueIfToday !== null && dueIfToday > monthEnd
  const dueHint = dueIfToday === null
    ? paymentMethod === 'PUE' ? 'Sin días de crédito, queda cobrada al timbrarla.' : 'Sin días de crédito, no tendrá fecha de vencimiento.'
    : paymentTermsDays === 0
      ? paymentMethod === 'PUE' ? 'Queda cobrada al timbrarla.' : 'Vence el día que la timbres.'
      : `Vence el ${formatDayLong(dueIfToday)} si la timbras hoy.${paymentMethod === 'PUE' ? ' Quedará por cobrar hasta que marques que te pagaron.' : ''}`

  const suggestion = suggestWithholdings(selectedProfile, selectedClient?.rfc)
  const isrChoices = selectedProfile?.taxRegime === '612' ? ISR_HONORARIOS_RATE : ISR_RESICO_RATE

  /** Applies the client's own defaults (Uso CFDI) and the withholdings its RFC calls for. */
  function onClientChange(clientId: string, list: Client[] = clients) {
    form.setValue('clientId', clientId, { shouldValidate: true })
    const client = list.find((c) => c.id === clientId)
    if (!client) return
    form.setValue('ivaRate', clientIvaRate(client))
    form.setValue('paymentTermsDays', client.paymentTermsDays ?? null, { shouldValidate: true })
    // A client abroad: uso S01, no withholdings, and it pays in dollars.
    if (isForeignClient(client)) {
      form.setValue('cfdiUsage', FOREIGN_CFDI_USAGE)
      form.setValue('isrWithholdingRate', null)
      form.setValue('ivaWithholdingRate', null)
      if (form.getValues('currency') === 'MXN') void onCurrencyChange('USD')
      return
    }
    const usage = client.cfdiUsage && client.cfdiUsage !== 'P01' ? client.cfdiUsage : DEFAULT_CFDI_USAGE
    form.setValue('cfdiUsage', usage)
    if (!withholdingsTouched) {
      const next = suggestWithholdings(selectedProfile, client.rfc)
      form.setValue('isrWithholdingRate', next.isrWithholdingRate)
      form.setValue('ivaWithholdingRate', next.ivaWithholdingRate)
    }
  }

  /** Dollars take today's DOF rate from Banxico when there is one; otherwise the user types it. */
  async function onCurrencyChange(next: 'MXN' | 'USD') {
    form.setValue('currency', next, { shouldValidate: true })
    if (next === 'MXN') {
      form.setValue('exchangeRate', null)
      form.setValue('exchangeRateSource', null)
      setRateStatus('idle')
      return
    }
    if (form.getValues('exchangeRate')) return
    setRateStatus('loading')
    const { rate } = await getDofRateAction(next, todayInMexicoCity())
    if (rate) {
      form.setValue('exchangeRate', rate, { shouldValidate: true })
      form.setValue('exchangeRateSource', 'dof')
      setRateStatus('idle')
    } else {
      form.setValue('exchangeRateSource', 'manual')
      setRateStatus('unavailable')
    }
  }

  function onPaymentMethodChange(method: 'PUE' | 'PPD') {
    form.setValue('paymentMethod', method, { shouldValidate: true })
    if (method === 'PPD') form.setValue('paymentForm', PAYMENT_FORM_TO_BE_DEFINED, { shouldValidate: true })
    else if (form.getValues('paymentForm') === PAYMENT_FORM_TO_BE_DEFINED) form.setValue('paymentForm', '')
  }

  /** Fills an invoice line with a saved service; a service without a fixed price keeps the line's price. */
  function fillFromCatalog(index: number, item: CatalogItem) {
    form.setValue(`items.${index}.description`, item.description, { shouldValidate: true })
    form.setValue(`items.${index}.productServiceCode`, item.productServiceCode, { shouldValidate: true })
    form.setValue(`items.${index}.unit`, item.unit, { shouldValidate: true })
    const price = priceForInvoice(item.unitPrice, pricesIncludeIva, ivaRate)
    if (price !== null) form.setValue(`items.${index}.unitPrice`, price, { shouldValidate: true })
    if (!form.getValues(`items.${index}.quantity`)) form.setValue(`items.${index}.quantity`, 1)
  }

  /** "Guardar en mis servicios": keeps the line for later invoices, with its price before IVA. */
  async function saveConcept(index: number) {
    const line = form.getValues(`items.${index}`)
    setSavingConcept(index)
    const result = await saveConceptToCatalogAction({
      description: line.description,
      productServiceCode: line.productServiceCode,
      unit: line.unit,
      unitPrice: line.unitPrice > 0 ? priceForCatalog(line.unitPrice, pricesIncludeIva, ivaRate) : null,
    })
    setSavingConcept(null)
    if (!result.success) {
      toast.error('No se guardó el servicio', { description: result.error })
      return
    }
    const saved = result.item
    setCatalog((current) =>
      [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.description.localeCompare(b.description, 'es')))
    toast.success(result.created ? 'Guardado en tus servicios' : 'Actualizamos el servicio', { description: saved.description })
  }

  async function createClientInline(data: ClientFormData) {
    const result = await createClientAction(data)
    if (result.success && result.data) {
      const created = result.data as Client
      const next = [created, ...clients]
      setClients(next)
      onClientChange(created.id, next)
      setNewClientOpen(false)
    }
    return result
  }

  async function save(data: InvoiceFormData, intent: 'draft' | 'stamp') {
    setSubmitting(intent)
    try {
      if (template) {
        const saved = await updateRecurringTemplateAction(template.id, data)
        if (!saved.success) {
          toast.error('No se guardaron los conceptos', { description: saved.error })
          return
        }
        toast.success('Conceptos guardados', { description: 'Se usan desde la siguiente factura.' })
        router.push('/invoices/recurring')
        router.refresh()
        return
      }

      const result = isEditing
        ? await updateInvoiceAction(invoice.id, data)
        : await createInvoiceAction(data)

      if (!result.success) {
        toast.error('No se guardó la factura', { description: result.error })
        return
      }

      toast.success(intent === 'stamp' ? 'Borrador guardado. Revisa y timbra.' : 'Borrador guardado')
      router.push(`/invoices/${result.invoiceId}${intent === 'stamp' ? '?timbrar=1' : ''}`)
      router.refresh()
    } catch {
      toast.error('No se guardó la factura', { description: 'Revisa tu conexión e intenta de nuevo.' })
    } finally {
      setSubmitting(null)
    }
  }

  const canSubmit = profiles.length > 0 && !submitting

  // A correction that changes the client's RFC cannot replace the original: the SAT asks to cancel it first (motive 02).
  const correctionRfcChanged = !!replaces?.receiverRfc && replaces.status === 'timbrada'
    && !!selectedClient && selectedClient.rfc !== replaces.receiverRfc

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => save(data, 'draft'))} className="space-y-5">
        {replaces && (
          <p
            className={cn(
              'rounded-[4px] px-4 py-3 text-[13px] text-tinta',
              correctionRfcChanged ? 'border border-ocre/40 bg-ocre-tenue' : 'bg-sello-tenue',
            )}
          >
            {correctionRfcChanged ? (
              <>
                Cambiaste el cliente. Cuando el RFC estaba mal, el SAT pide cancelar primero la{' '}
                <span className="font-mono">{replaces.label}</span> con el motivo 02 y después timbrar esta. Puedes
                guardar el borrador mientras tanto.
              </>
            ) : replaces.status === 'timbrada' ? (
              <>
                Corriges la factura <span className="font-mono">{replaces.label}</span>: cambia lo que estaba mal. Al
                timbrar esta, pediremos al SAT cancelar la <span className="font-mono">{replaces.label}</span> con el
                motivo 01.
              </>
            ) : (
              <>
                Corriges la factura <span className="font-mono">{replaces.label ?? replaces.uuid}</span>, que ya está
                cancelada.
              </>
            )}
          </p>
        )}

        {/* The draft is a sheet written in pencil */}
        <div className="hoja-borrador overflow-hidden">
          {/* Header band: issuer on the left, folio on the right */}
          <header className="guilloche flex flex-col gap-4 border-b border-renglon px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
            <div className="min-w-0 space-y-1">
              <p className="text-[13px] text-tinta-tenue">Factura de ingreso · CFDI 4.0</p>
              {profiles.length === 0 ? (
                <p className="text-sm text-ocre">
                  Configura tu perfil fiscal antes de facturar.{' '}
                  <a href="/fiscal-profiles" className="font-medium underline underline-offset-2">Configurar</a>
                </p>
              ) : profiles.length === 1 && selectedProfile ? (
                <IssuerLine profile={selectedProfile} />
              ) : (
                <FormField
                  control={form.control}
                  name="issuingProfileId"
                  render={({ field, fieldState }) => (
                    <FormItem className="max-w-md">
                      <FormLabel className="sr-only">Emisor</FormLabel>
                      <Combobox
                        options={profileOptions}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value)
                          if (!withholdingsTouched) {
                            const p = profiles.find((x) => x.id === value)
                            const next = suggestWithholdings(p, selectedClient?.rfc)
                            form.setValue('isrWithholdingRate', next.isrWithholdingRate)
                            form.setValue('ivaWithholdingRate', next.ivaWithholdingRate)
                          }
                        }}
                        placeholder="Elige con qué RFC facturas"
                        searchPlaceholder="Buscar RFC o razón social"
                        aria-invalid={!!fieldState.error}
                      />
                      {selectedProfile && <IssuerLine profile={selectedProfile} compact />}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex shrink-0 items-end gap-3 sm:flex-col sm:items-end sm:gap-1.5">
              {invoice ? (
                <Folio serie={invoice.serie} folio={invoice.folio} tone="roja" className="text-xl" />
              ) : (
                <p className="font-mono text-[13px] text-tinta-tenue">{template ? 'Nº se asigna cada mes' : 'Nº se asigna al guardar'}</p>
              )}
              <FormField
                control={form.control}
                name="serie"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="text-[13px] font-normal text-tinta-tenue">Serie</FormLabel>
                    <FormControl>
                      <Input placeholder="—" className="h-8 w-20 font-mono uppercase" maxLength={25} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </header>

          <div className="space-y-7 px-5 py-6 sm:px-7">
            {/* Receptor */}
            <section className="space-y-3">
              <SectionLabel>Para quién es</SectionLabel>
              <FormField
                control={form.control}
                name="clientId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Cliente</FormLabel>
                    <Combobox
                      options={clientOptions}
                      value={field.value}
                      onChange={(value) => onClientChange(value)}
                      placeholder={clients.length ? 'Elige un cliente' : 'Aún no tienes clientes'}
                      searchPlaceholder="Buscar por nombre o RFC"
                      emptyText="Ningún cliente coincide"
                      aria-invalid={!!fieldState.error}
                      footer={
                        <button
                          type="button"
                          onClick={() => setNewClientOpen(true)}
                          className="flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm text-sello hover:bg-sello-tenue"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Nuevo cliente
                        </button>
                      }
                    />
                    <FormMessage />
                    {selectedClient && (clientIsForeign ? (
                      <p className="text-[13px] text-tinta-tenue">
                        En el extranjero · {countryNames.get(selectedClient.country ?? '') ?? selectedClient.country}
                        {selectedClient.foreignTaxId && <> · <span className="font-mono">{selectedClient.foreignTaxId}</span></>}
                        {' · RFC '}
                        <span className="font-mono">{selectedClient.rfc}</span>
                      </p>
                    ) : (
                      <p className="text-[13px] text-tinta-tenue">
                        <span className="font-mono">{selectedClient.rfc}</span>
                        {' · '}
                        {receptorIsMoral ? 'Persona moral' : 'Persona física'}
                        {' · CP '}
                        <span className="font-mono">{selectedClient.postalCode}</span>
                        {selectedClient.taxRegime && <> · Régimen <span className="font-mono">{selectedClient.taxRegime}</span></>}
                      </p>
                    ))}
                    {clients.length === 0 && (
                      <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setNewClientOpen(true)}>
                        <UserPlus />
                        Agregar mi primer cliente
                      </Button>
                    )}
                  </FormItem>
                )}
              />
            </section>

            {/* Pago */}
            <section className="space-y-3">
              <SectionLabel>Cómo te pagan</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método</FormLabel>
                      <div className="grid grid-cols-2 gap-1 rounded-md border border-input bg-hoja p-0.5" role="radiogroup">
                        {([
                          ['PUE', 'En el mes'],
                          ['PPD', 'Pago después'],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={field.value === value}
                            onClick={() => onPaymentMethodChange(value)}
                            className={cn(
                              'h-8 rounded-[4px] text-[13px] transition-colors',
                              field.value === value ? 'bg-sello-tenue font-medium text-tinta' : 'text-tinta-tenue hover:text-tinta',
                            )}
                          >
                            {label} <span className="font-mono text-[11px] opacity-70">{value}</span>
                          </button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentForm"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Forma de pago</FormLabel>
                      <Combobox
                        options={paymentFormOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={paymentMethod === 'PPD'}
                        placeholder="Transferencia, efectivo…"
                        searchPlaceholder="Buscar forma de pago"
                        aria-invalid={!!fieldState.error}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cfdiUsage"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Uso del CFDI</FormLabel>
                      <Combobox
                        options={cfdiUsageOptions}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={clientIsForeign}
                        placeholder="Elige el uso"
                        searchPlaceholder="Buscar uso"
                        aria-invalid={!!fieldState.error}
                      />
                      {clientIsForeign && <p className="text-[12px] text-tinta-tenue">S01, como pide el SAT para un cliente del extranjero.</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <div className="grid grid-cols-2 gap-1 rounded-md border border-input bg-hoja p-0.5" role="radiogroup" aria-label="Moneda">
                        {([
                          ['MXN', 'Pesos'],
                          ['USD', 'Dólares'],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={field.value === value}
                            onClick={() => void onCurrencyChange(value)}
                            className={cn(
                              'h-8 rounded-[4px] text-[13px] transition-colors',
                              field.value === value ? 'bg-sello-tenue font-medium text-tinta' : 'text-tinta-tenue hover:text-tinta',
                            )}
                          >
                            {label} <span className="font-mono text-[11px] opacity-70">{value}</span>
                          </button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
                {currency !== 'MXN' && (
                  <FormField
                    control={form.control}
                    name="exchangeRate"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Tipo de cambio</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.000001"
                            min="0"
                            placeholder={rateStatus === 'loading' ? 'Consultando a Banxico…' : '18.4250'}
                            className="max-w-[160px] text-right font-mono"
                            name={field.name}
                            ref={field.ref}
                            onBlur={field.onBlur}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                              form.setValue('exchangeRateSource', 'manual')
                            }}
                          />
                        </FormControl>
                        <p className="text-[12px] text-tinta-tenue">
                          {exchangeRateSource === 'dof'
                            ? 'El que publicó Banxico en el DOF para hoy. Al timbrar se usa el del día del timbrado.'
                            : rateStatus === 'unavailable'
                              ? 'No pudimos consultarlo a Banxico. Escribe el que publicó en el DOF para hoy, o el de tu banco si compraste los dólares.'
                              : 'Pesos por dólar. Usa el que publicó Banxico en el DOF para hoy, o el de tu banco si compraste los dólares.'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="paymentTermsDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Días de crédito
                      <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional</span>
                    </FormLabel>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={MAX_PAYMENT_TERMS_DAYS}
                          step={1}
                          placeholder="30"
                          className="w-[96px] font-mono"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                        />
                      </FormControl>
                      <p className="text-[12px] text-tinta-tenue">{dueHint}</p>
                    </div>
                    {pueAfterMonthEnd && (
                      <p className="rounded-[4px] border border-ocre/40 bg-ocre-tenue px-3 py-2 text-[13px] text-tinta">
                        Vence después de fin de mes. Si te pagan después del {formatDayLong(monthEnd)}, el SAT pide
                        usar «Pago después» (PPD).{' '}
                        <button
                          type="button"
                          onClick={() => onPaymentMethodChange('PPD')}
                          className="font-medium text-sello underline underline-offset-2"
                        >
                          Cambiar a PPD
                        </button>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Conceptos */}
            <section className="space-y-3">
              <SectionLabel
                action={
                  <FormField
                    control={form.control}
                    name="pricesIncludeIva"
                    render={({ field }) => (
                      <div className="flex items-center gap-1 text-[13px]" role="radiogroup" aria-label="Los precios incluyen IVA">
                        {([
                          [false, 'Precios sin IVA'],
                          [true, 'Con IVA incluido'],
                        ] as const).map(([value, label]) => (
                          <button
                            key={label}
                            type="button"
                            role="radio"
                            aria-checked={field.value === value}
                            onClick={() => field.onChange(value)}
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
                Qué cobras
              </SectionLabel>

              <div className="divide-y divide-renglon">
                {fields.map((field, index) => {
                  const concept = amounts.concepts[index]
                  return (
                    <div key={field.id} className="grid grid-cols-6 gap-x-3 gap-y-2 py-4 first:pt-1 sm:grid-cols-12">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="col-span-6 sm:col-span-12">
                            <div className="flex items-center justify-between gap-2">
                              <FormLabel className="text-[12px] text-tinta-tenue">Descripción</FormLabel>
                              {catalog.length > 0 && (
                                <CatalogPicker
                                  items={catalog}
                                  pricesIncludeIva={pricesIncludeIva}
                                  ivaRate={ivaRate}
                                  currency={currency}
                                  onPick={(item) => fillFromCatalog(index, item)}
                                />
                              )}
                            </div>
                            <FormControl>
                              <Input placeholder="Diseño de identidad visual, octubre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.productServiceCode`}
                        render={({ field, fieldState }) => (
                          <FormItem className="col-span-6 sm:col-span-5">
                            <FormLabel className="text-[12px] text-tinta-tenue">Clave SAT del producto o servicio</FormLabel>
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
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem className="col-span-3 sm:col-span-2">
                            <FormLabel className="text-[12px] text-tinta-tenue">Unidad</FormLabel>
                            <Combobox
                              options={unitOptions}
                              value={field.value}
                              onChange={field.onChange}
                              searchPlaceholder="Buscar unidad"
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="col-span-3 sm:col-span-1">
                            <FormLabel className="text-[12px] text-tinta-tenue">Cant.</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                min="0"
                                className="px-2 text-right font-mono"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          <FormItem className="col-span-3 sm:col-span-2">
                            <FormLabel className="text-[12px] text-tinta-tenue">
                              Precio {pricesIncludeIva ? 'con IVA' : 'sin IVA'}
                              {currency !== 'MXN' && <span className="ml-1 font-mono text-[11px]">{currency}</span>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="text-right font-mono"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-3 flex items-end justify-end gap-1 sm:col-span-2">
                        <div className="pb-2 text-right">
                          <p className="text-[12px] text-tinta-tenue">Importe</p>
                          <p className="font-mono text-sm">{formatCurrency(concept?.base ?? 0, currency)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveConcept(index)}
                          disabled={savingConcept === index}
                          aria-label={`Guardar el concepto ${index + 1} en mis servicios`}
                          title="Guardar en mis servicios"
                          className="mb-1.5 rounded-[4px] p-1.5 text-tinta-tenue transition-colors hover:bg-sello-tenue hover:text-sello disabled:opacity-50"
                        >
                          {savingConcept === index ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                        </button>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label={`Quitar concepto ${index + 1}`}
                            className="mb-1.5 rounded-[4px] p-1.5 text-tinta-tenue transition-colors hover:bg-tinta-roja/10 hover:text-tinta-roja"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-sello hover:text-sello"
                onClick={() => append(emptyItem(items?.[items.length - 1]?.productServiceCode ?? ''))}
              >
                <Plus />
                Agregar concepto
              </Button>
              {catalog.length === 0 && (
                <p className="text-[12px] text-tinta-tenue">
                  ¿Facturas esto seguido? Guárdalo con <BookmarkPlus className="inline h-3 w-3 align-[-2px]" aria-label="el ícono de guardar" /> y
                  en la próxima factura lo eliges de tus servicios.
                </p>
              )}
            </section>

            {/* IVA of a client abroad: 0 % for exported services, or 16 %; no withholdings */}
            {clientIsForeign ? (
            <section className="space-y-3">
              <SectionLabel>IVA</SectionLabel>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="IVA de la factura">
                {([
                  [0, '0 % · exportación de servicios'],
                  [IVA_RATE, '16 %'],
                ] as const).map(([value, label]) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={ivaRate === value}
                    onClick={() => form.setValue('ivaRate', value, { shouldValidate: true })}
                    className={cn(
                      'rounded-[4px] border px-3 py-1.5 text-[13px] transition-colors',
                      ivaRate === value
                        ? 'border-sello bg-sello-tenue font-medium text-tinta'
                        : 'border-renglon text-tinta-tenue hover:border-tinta-tenue/50 hover:text-tinta',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="max-w-prose text-[13px] text-tinta-tenue">
                {ivaRate === 0
                  ? 'Si tu cliente no tiene establecimiento en México, aprovecha todo el servicio fuera y te paga por transferencia o cheque desde una cuenta del extranjero. Un cliente del extranjero no te retiene impuestos.'
                  : 'Un cliente del extranjero no te retiene impuestos.'}
              </p>
            </section>
            ) : (
            <section className="space-y-3">
              <SectionLabel>Retenciones</SectionLabel>
              {suggestion.isrWithholdingRate ? (
                <p className="max-w-prose text-[13px] text-tinta-tenue">
                  Tu cliente es persona moral y tú tributas en el régimen {selectedProfile?.taxRegime}: te retiene ISR{' '}
                  {percent(suggestion.isrWithholdingRate)} e IVA {percent(IVA_WITHHOLDING_RATE)} (dos terceras partes).
                </p>
              ) : (
                <p className="max-w-prose text-[13px] text-tinta-tenue">
                  {receptorIsMoral === null
                    ? 'Solo aplican si le facturas a una persona moral.'
                    : receptorIsMoral === false
                      ? 'Una persona física no te retiene impuestos.'
                      : selectedProfile?.rfc.length === 12
                        ? 'A una persona moral no se le retiene ISR ni IVA por sus servicios.'
                        : 'Tu régimen no tiene retenciones sugeridas. Si tu cliente te retiene, agrégalas aquí.'}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <WithholdingToggle
                  label={`ISR ${percent(isrChoices)}`}
                  checked={!!isrRate}
                  onChange={(on) => {
                    setWithholdingsTouched(true)
                    form.setValue('isrWithholdingRate', on ? isrChoices : null)
                  }}
                />
                <WithholdingToggle
                  label={`IVA ${percent(IVA_WITHHOLDING_RATE)}`}
                  checked={!!ivaRetRate}
                  onChange={(on) => {
                    setWithholdingsTouched(true)
                    form.setValue('ivaWithholdingRate', on ? IVA_WITHHOLDING_RATE : null)
                  }}
                />
              </div>
            </section>
            )}

            {/* Totales */}
            <section className="ml-auto max-w-sm border-t border-renglon pt-4">
              <dl className="space-y-1.5 text-sm">
                <TotalRow label="Subtotal" value={amounts.subtotal} currency={currency} />
                <TotalRow label={`IVA ${ivaRate === 0 ? 0 : 16} %`} value={amounts.iva} currency={currency} />
                {amounts.isrWithheld > 0 && <TotalRow label="Retención ISR" value={-amounts.isrWithheld} currency={currency} />}
                {amounts.ivaWithheld > 0 && <TotalRow label="Retención IVA" value={-amounts.ivaWithheld} currency={currency} />}
              </dl>
              <div className="mt-3 flex items-baseline justify-between border-t border-tinta/80 pt-3">
                <span className="text-sm font-medium">
                  {amounts.withholdings > 0 ? 'Neto a recibir' : 'Total'}
                </span>
                <span className="font-mono text-2xl font-medium tracking-tight">{formatCurrency(amounts.total, currency)}</span>
              </div>
              {currency !== 'MXN' && exchangeRate ? (
                <p className="mt-1 text-right text-[12px] text-tinta-tenue">
                  Son <span className="font-mono">{formatCurrency(round2(amounts.total * exchangeRate))}</span> al tipo de cambio{' '}
                  <span className="font-mono">{exchangeRate}</span>
                </p>
              ) : null}
            </section>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(template ? '/invoices/recurring' : isEditing ? `/invoices/${invoice.id}` : '/invoices')}
            disabled={!!submitting}
          >
            Cancelar
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {template ? (
              <Button type="submit" disabled={!canSubmit}>
                {submitting === 'draft' && <Loader2 className="animate-spin" />}
                Guardar cambios
              </Button>
            ) : (
              <>
                <Button type="submit" variant="outline" disabled={!canSubmit}>
                  {submitting === 'draft' && <Loader2 className="animate-spin" />}
                  Guardar borrador
                </Button>
                <Button
                  type="button"
                  disabled={!canSubmit}
                  onClick={form.handleSubmit((data) => save(data, 'stamp'))}
                >
                  {submitting === 'stamp' && <Loader2 className="animate-spin" />}
                  Guardar y timbrar
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <ClientForm
            catalogs={clientCatalogs}
            onSubmit={createClientInline}
            onCancel={() => setNewClientOpen(false)}
            submitLabel="Guardar y usar en esta factura"
          />
        </DialogContent>
      </Dialog>
    </Form>
  )
}

function IssuerLine({ profile, compact }: { profile: PublicIssuingProfile; compact?: boolean }) {
  return (
    <div className={cn('space-y-0.5', compact && 'pt-1')}>
      {!compact && <p className="text-lg font-semibold tracking-tight">{profile.businessName}</p>}
      <p className="text-[13px] text-tinta-tenue">
        <span className="font-mono">{profile.rfc}</span> · Régimen <span className="font-mono">{profile.taxRegime}</span> · CP{' '}
        <span className="font-mono">{profile.postalCode}</span>
        {profile.hasCsd ? null : (
          <>
            {' · '}
            <a href="/fiscal-profiles" className="text-ocre underline underline-offset-2">Falta tu CSD para timbrar</a>
          </>
        )}
      </p>
    </div>
  )
}

function WithholdingToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[13px] transition-colors',
        checked ? 'border-sello bg-sello-tenue text-tinta' : 'border-input bg-hoja text-tinta-tenue hover:text-tinta',
      )}
    >
      <span
        aria-hidden
        className={cn('h-3 w-3 rounded-[3px] border', checked ? 'border-sello bg-sello' : 'border-tinta-tenue/60')}
      />
      Retener {label}
    </button>
  )
}

function TotalRow({ label, value, currency = 'MXN' }: { label: string; value: number; currency?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-tinta-tenue">{label}</dt>
      <dd className="font-mono">{value < 0 ? `−${formatCurrency(-value, currency)}` : formatCurrency(value, currency)}</dd>
    </div>
  )
}
