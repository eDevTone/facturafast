'use client'

import { getDofRateAction } from '@features/exchange-rates/actions/get-dof-rate.action'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { round2 } from '@features/invoicing/utils/cfdi-amounts'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@shared/ui/button'
import { Combobox, type ComboboxOption } from '@shared/ui/combobox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import { HandCoins, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { correctPaymentAction } from '../actions/correct-payment.action'
import { registerPaymentAction } from '../actions/register-payment.action'
import { registerPaymentSchema, type RegisterPaymentFormData } from '../schemas/payment-form.schema'
import type { InvoiceBalance, PaymentReplacementOutcome } from '../types/payment.types'
import { formatDayLong, paymentComplementDeadline } from '../utils/payment-dates'

/** Most freelancers are paid by transfer. */
const DEFAULT_PAYMENT_FORM = '03'

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** The DOF rate looked up for a payment day; `rate` is null when Banxico did not answer. */
interface RateLookup {
  day: string
  rate: number | null
}

interface RegisterPaymentDialogProps {
  invoiceId: string
  clientName: string
  clientEmail?: string | null
  balance: InvoiceBalance
  /** c_FormaPago without 99. */
  paymentFormOptions: ComboboxOption[]
  stampsBalance: number
  /** Today in Mexico City, YYYY-MM-DD. */
  today: string
  /** Day the invoice was issued, YYYY-MM-DD: a payment cannot be older. */
  invoiceDay: string
  /** Currency of the invoice: the payment is recorded in the same one (MonedaP). */
  currency?: string
  /** "Corregir cobro": the payment the new complemento replaces; its data fill the form. */
  correcting?: CorrectedPayment
  /** Controlled from outside (the talón menu); without it, the dialog has its own trigger button. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** The last payment of an invoice, as "Corregir cobro" needs it. */
export interface CorrectedPayment {
  paymentId: string
  /** "P-2" */
  label: string
  paidOn: string
  paymentForm: string
  amount: number
  operationNumber: string | null
  /** TipoCambioP of a payment in dollars. */
  exchangeRate: number | null
}

/** The toast that tells what happened to the complemento a correction replaces. */
function announceReplacement(replacement: PaymentReplacementOutcome) {
  if (replacement.outcome === 'cancelado') {
    toast.success(`El ${replacement.label} quedó cancelado`)
  } else if (replacement.outcome === 'en_proceso') {
    toast.success(`Pedimos al SAT cancelar el ${replacement.label}`, {
      description: 'Tu cliente tiene que aceptarla; verás el estatus en el talón.',
    })
  } else {
    toast.warning(`El ${replacement.label} sigue vigente`, {
      description: `${replacement.error ?? 'No se pudo pedir su cancelación.'} Pídela desde el talón.`,
    })
  }
}

/**
 * "Registrar cobro": records a payment of a PPD invoice and stamps its complemento de pago.
 * With `correcting`, "Corregir cobro": the new complemento replaces the last one, with its
 * installment, and the SAT is asked to cancel the old one.
 */
export function RegisterPaymentDialog({
  invoiceId,
  clientName,
  clientEmail,
  balance,
  paymentFormOptions,
  stampsBalance,
  today,
  invoiceDay,
  currency = 'MXN',
  correcting,
  open: controlledOpen,
  onOpenChange,
}: RegisterPaymentDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = (next: boolean) => (isControlled ? onOpenChange?.(next) : setInternalOpen(next))
  const [isSaving, startSaving] = useTransition()
  const noStamps = stampsBalance < 1
  const inPesos = currency === 'MXN'

  const schema = useMemo(
    () =>
      registerPaymentSchema
        .refine((data) => data.amount <= balance.balance, {
          message: `El saldo de la factura es ${formatCurrency(balance.balance, currency)}`,
          path: ['amount'],
        })
        .refine((data) => data.paidOn <= today, { message: 'La fecha no puede ser posterior a hoy', path: ['paidOn'] })
        .refine((data) => data.paidOn >= invoiceDay, {
          message: 'La fecha no puede ser anterior a la factura',
          path: ['paidOn'],
        })
        .refine((data) => currency === 'MXN' || (data.exchangeRate ?? 0) > 0, {
          message: 'Escribe el tipo de cambio del día en que te pagaron',
          path: ['exchangeRate'],
        }),
    [balance.balance, today, invoiceDay, currency],
  )

  const defaultValues: RegisterPaymentFormData = correcting
    ? {
        invoiceId,
        paidOn: correcting.paidOn,
        paymentForm: correcting.paymentForm,
        amount: correcting.amount,
        operationNumber: correcting.operationNumber ?? '',
        exchangeRate: inPesos ? null : correcting.exchangeRate,
      }
    : {
        invoiceId,
        paidOn: today,
        paymentForm: DEFAULT_PAYMENT_FORM,
        amount: balance.balance,
        operationNumber: '',
        exchangeRate: null,
      }

  const form = useForm<RegisterPaymentFormData>({ resolver: zodResolver(schema), defaultValues })
  const { setValue } = form
  const [paidOn, amount, exchangeRate] = useWatch({ control: form.control, name: ['paidOn', 'amount', 'exchangeRate'] })
  const remaining = round2(balance.balance - (Number(amount) || 0))
  const deadline = DAY_PATTERN.test(paidOn) ? paymentComplementDeadline(paidOn) : null
  const isLate = deadline !== null && deadline < today

  // In dollars, the rate follows the payment day (the DOF one) until the user types one; the
  // rate of a corrected payment counts as typed.
  const initiallyTyped = !inPesos && !!correcting?.exchangeRate
  const [lookup, setLookup] = useState<RateLookup | null>(null)
  const [rateTyped, setRateTyped] = useState(initiallyTyped)
  const lookupDay = lookup?.day
  const rateLoading = open && !inPesos && DAY_PATTERN.test(paidOn) && lookupDay !== paidOn
  const dofRate = lookupDay === paidOn ? (lookup?.rate ?? null) : null

  useEffect(() => {
    if (!open || inPesos || !DAY_PATTERN.test(paidOn) || lookupDay === paidOn) return
    let current = true
    void getDofRateAction(currency, paidOn).then(({ rate }) => {
      if (!current) return
      setLookup({ day: paidOn, rate })
      if (!rateTyped) setValue('exchangeRate', rate, { shouldValidate: rate !== null })
    })
    return () => {
      current = false
    }
  }, [open, inPesos, currency, paidOn, lookupDay, rateTyped, setValue])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      form.reset(defaultValues)
      setLookup(null)
      setRateTyped(initiallyTyped)
    }
  }

  const applyDofRate = () => {
    setValue('exchangeRate', dofRate, { shouldValidate: true })
    setRateTyped(false)
  }

  const onSubmit = (data: RegisterPaymentFormData) => {
    startSaving(async () => {
      let replacement: PaymentReplacementOutcome | undefined
      let result: Awaited<ReturnType<typeof registerPaymentAction>>
      if (correcting) {
        const corrected = await correctPaymentAction(correcting.paymentId, data)
        if (corrected.success) replacement = corrected.replacement
        result = corrected
      } else {
        result = await registerPaymentAction(data)
      }
      if (result.success) {
        toast.success(correcting ? 'Cobro corregido' : 'Cobro registrado', {
          description: clientEmail
            ? `Timbramos el complemento de pago y enviamos el XML y el PDF a ${clientEmail}.`
            : 'Timbramos el complemento de pago. Ya puedes descargar el XML y el PDF.',
        })
        if (replacement) announceReplacement(replacement)
        handleOpenChange(false)
        router.refresh()
        return
      }

      if (result.code === 'UNCONFIRMED') {
        toast.warning('Cobro sin confirmar', { description: result.error })
        handleOpenChange(false)
        router.refresh()
        return
      }

      toast.error(correcting ? 'No se corrigió el cobro' : 'No se registró el cobro', {
        description: result.error,
        action: result.code === 'NO_STAMPS'
          ? { label: 'Comprar timbres', onClick: () => router.push('/billing') }
          : undefined,
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <HandCoins />
            Registrar cobro
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{correcting ? 'Corregir cobro' : 'Registrar cobro'}</DialogTitle>
          <DialogDescription>
            {correcting ? (
              <>
                Timbramos un complemento que sustituye al <span className="font-mono text-tinta">{correcting.label}</span>,
                con la misma parcialidad. Después pedimos al SAT cancelar el {correcting.label}.
              </>
            ) : (
              <>
                Timbramos el complemento de pago para <span className="text-tinta">{clientName}</span> con los impuestos
                de la parte que te pagaron.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id="register-payment" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="paidOn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha en que te pagaron</FormLabel>
                    <FormControl>
                      <Input type="date" min={invoiceDay} max={today} className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto cobrado</FormLabel>
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
            </div>

            {!inPesos && (
              <FormField
                control={form.control}
                name="exchangeRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de cambio</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.000001"
                        min="0"
                        placeholder={rateLoading ? 'Consultando a Banxico…' : '18.4250'}
                        className="max-w-[160px] text-right font-mono"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))
                          setRateTyped(e.target.value !== '')
                        }}
                      />
                    </FormControl>
                    <p className="text-[12px] text-tinta-tenue">
                      {rateLoading ? (
                        'Consultando el del DOF para ese día…'
                      ) : !rateTyped && dofRate ? (
                        `El que publicó Banxico en el DOF para el ${formatDayLong(paidOn)}.`
                      ) : !rateTyped ? (
                        'No pudimos consultarlo a Banxico. Escribe el que publicó en el DOF para el día en que te pagaron.'
                      ) : dofRate && dofRate !== exchangeRate ? (
                        <>
                          El del DOF para el {formatDayLong(paidOn)} es <span className="font-mono">{dofRate}</span>.{' '}
                          <button type="button" onClick={applyDofRate} className="font-medium text-sello underline underline-offset-2">
                            Usar ese
                          </button>
                        </>
                      ) : (
                        'Pesos por dólar del día en que te pagaron.'
                      )}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                    placeholder="Elige cómo te pagaron"
                    searchPlaceholder="Busca por clave o nombre"
                    emptyText="Ninguna forma de pago coincide"
                    aria-invalid={!!fieldState.error}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Número de operación
                    <span className="ml-1.5 text-[12px] font-normal text-tinta-tenue">opcional</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Clave de rastreo SPEI o número de cheque" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isLate && deadline && (
              <p className="rounded-[4px] border border-ocre/40 bg-ocre-tenue px-3 py-2 text-[13px] text-tinta">
                El plazo para timbrar este complemento venció el {formatDayLong(deadline)}. Puedes timbrarlo de todos
                modos.
              </p>
            )}

            {clientEmail && (
              <p className="text-[13px] text-tinta-tenue">
                Enviaremos el XML y el PDF del complemento a <span className="text-tinta">{clientEmail}</span>.
              </p>
            )}

            <dl className="divide-y divide-renglon border-y border-renglon text-sm text-tinta-tenue">
              {correcting && (
                <div className="flex justify-between gap-4 py-2">
                  <dt>Sustituye a</dt>
                  <dd className="font-mono text-tinta">{correcting.label}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 py-2">
                <dt>Parcialidad</dt>
                <dd className="font-mono text-tinta">{balance.nextInstallment}</dd>
              </div>
              {!inPesos && exchangeRate ? (
                <div className="flex justify-between gap-4 py-2">
                  <dt>Cobro en pesos</dt>
                  <dd className="font-mono text-tinta">{formatCurrency(round2((Number(amount) || 0) * exchangeRate))}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 py-2">
                <dt>Saldo después del cobro</dt>
                <dd className={remaining < 0 ? 'font-mono text-tinta-roja' : 'font-mono text-tinta'}>
                  {formatCurrency(remaining, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt>Timbres</dt>
                <dd className={noStamps ? 'text-tinta-roja' : 'text-tinta'}>
                  <span className="font-mono">{stampsBalance}</span> {stampsBalance === 1 ? 'disponible' : 'disponibles'} · usa 1
                </dd>
              </div>
            </dl>
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          {noStamps ? (
            <Button asChild>
              <a href="/billing">Comprar timbres</a>
            </Button>
          ) : (
            <Button type="submit" form="register-payment" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              {isSaving ? 'Timbrando…' : correcting ? 'Timbrar corrección' : 'Timbrar complemento'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
