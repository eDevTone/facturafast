'use client'

import { SectionLabel } from '@shared/components/section-label'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/ui/form'
import { Input } from '@shared/ui/input'
import { Check } from 'lucide-react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import type { IssuingProfileFormValues } from '../schemas/issuing-profile-form.schema'
import { clabeBank, isValidClabe, normalizeClabe } from '../utils/clabe'

/**
 * "Para que te paguen": the CLABE (its bank shows up as it is typed), the bank and a payment link.
 * They go on the invoice PDF and in the payment reminders.
 */
export function PaymentDetailsFields({ form }: { form: UseFormReturn<IssuingProfileFormValues> }) {
  const clabe = useWatch({ control: form.control, name: 'clabe' }) ?? ''
  const bank = clabeBank(clabe)
  const complete = clabe.length === 18
  const valid = complete && isValidClabe(clabe)

  const onClabeChange = (raw: string, onChange: (value: string) => void) => {
    const next = normalizeClabe(raw).slice(0, 18)
    // The bank follows the CLABE until the user writes a different one.
    const bankName = form.getValues('bankName')
    if (!bankName || bankName === clabeBank(form.getValues('clabe') ?? '')) {
      form.setValue('bankName', clabeBank(next) ?? '', { shouldDirty: true })
    }
    onChange(next)
  }

  return (
    <section className="space-y-4">
      <div>
        <SectionLabel>
          Para que te paguen <span className="font-normal">· opcional</span>
        </SectionLabel>
        <p className="mt-1 text-[12px] text-tinta-tenue">Salen en el PDF de tus facturas y en los recordatorios de pago.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
        <FormField
          control={form.control}
          name="clabe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CLABE</FormLabel>
              <FormControl>
                <Input
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(e) => onClabeChange(e.target.value, field.onChange)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="18 dígitos"
                  className="font-mono tracking-wide"
                  aria-describedby="clabe-hint"
                />
              </FormControl>
              <p id="clabe-hint" className="flex items-center gap-1 text-[12px] text-tinta-tenue">
                {valid ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-sello" aria-hidden />
                    {bank ? `Válida, de ${bank}` : 'Válida. No reconocemos el banco: escríbelo.'}
                  </>
                ) : complete ? (
                  <span className="text-tinta-roja">El último dígito no coincide con los demás: revísala.</span>
                ) : (
                  'La de tu estado de cuenta; puedes pegarla con espacios.'
                )}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} maxLength={60} placeholder="Se llena con la CLABE" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="paymentLink"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link de pago</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} type="url" inputMode="url" placeholder="https://mpago.la/…" maxLength={300} />
            </FormControl>
            <p className="text-[12px] text-tinta-tenue">El de Mercado Pago, Clip, Stripe o el que uses, si cobras con tarjeta.</p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="autoReminders"
        render={({ field }) => (
          <FormItem>
            <label className="flex cursor-pointer items-start gap-3 rounded-[4px] border border-renglon px-3 py-3 transition-colors hover:bg-sello-tenue/40">
              <FormControl>
                <input
                  type="checkbox"
                  name={field.name}
                  ref={field.ref}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  onBlur={field.onBlur}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-sello"
                />
              </FormControl>
              <span>
                <span className="block text-sm font-medium">Recordar a mis clientes por correo cuando una factura venza</span>
                <span className="mt-0.5 block text-[12px] text-tinta-tenue">
                  Les escribimos el día después del vencimiento y otra vez a la semana, con estos datos para pagarte. Las
                  respuestas te llegan a ti.
                </span>
              </span>
            </label>
          </FormItem>
        )}
      />
    </section>
  )
}
