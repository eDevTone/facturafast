'use client'

import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Label } from '@shared/ui/label'
import { Textarea } from '@shared/ui/textarea'
import { formatDate } from '@shared/utils/date'
import { Loader2, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { logWhatsappReminderAction } from '../actions/log-reminder.action'
import { sendReminderEmailAction } from '../actions/send-reminder-email.action'
import type { LastReminder } from '../services/collection.service'
import type { CollectionState } from '../utils/collection-state'
import { dueLabel } from '../utils/due-date'
import { hasPaymentDetails, reminderMessage, type PaymentDetails } from '../utils/reminder-message'
import { whatsappLink, whatsappNumber } from '../utils/whatsapp'

interface RemindPaymentDialogProps {
  invoiceId: string
  /** "A-12" */
  invoiceLabel: string
  client: { businessName: string; email: string | null; phone: string | null; country: string | null }
  currency: string
  total: number
  state: CollectionState
  /** Today in Mexico City, YYYY-MM-DD. */
  today: string
  payment: PaymentDetails | null
  lastReminder: LastReminder | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * "Recordar pago": the reminder, ready to edit, goes out by WhatsApp (wa.me with the text typed
 * in) or by email with the invoice XML and PDF.
 */
export function RemindPaymentDialog({
  invoiceId,
  invoiceLabel,
  client,
  currency,
  total,
  state,
  today,
  payment,
  lastReminder,
  open,
  onOpenChange,
}: RemindPaymentDialogProps) {
  const router = useRouter()
  const [isSending, startSending] = useTransition()
  // Null until the user edits it: the suggested text follows the current balance.
  const [draft, setDraft] = useState<string | null>(null)
  const suggested = reminderMessage({
    invoiceLabel,
    currency,
    total,
    balance: state.balance,
    dueDate: state.dueDate,
    today,
    payment,
  })
  const message = draft ?? suggested
  const phone = whatsappNumber(client.phone, client.country)

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setDraft(null)
  }

  // The link opens WhatsApp first; the reminder is noted after, so the browser never blocks the tab.
  const handleWhatsapp = () => {
    void logWhatsappReminderAction(invoiceId).then(() => router.refresh())
    handleOpenChange(false)
  }

  const handleEmail = () => {
    startSending(async () => {
      const result = await sendReminderEmailAction(invoiceId, message)
      if (!result.success) {
        toast.error('No se envió el recordatorio', { description: result.error })
        return
      }
      toast.success('Recordatorio enviado', { description: `Le llegó a ${result.to} con el XML y el PDF de la factura.` })
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recordar pago</DialogTitle>
          <DialogDescription>
            {client.businessName} te debe <span className="font-mono text-tinta">{formatCurrency(state.balance, currency)}</span>{' '}
            de la factura <span className="font-mono text-tinta">{invoiceLabel}</span>.{' '}
            {state.dueDate ? (
              <span className={state.status === 'vencida' ? 'text-tinta-roja' : undefined}>{dueLabel(state.dueDate, today)}.</span>
            ) : (
              'No tiene fecha de vencimiento.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reminder-message">Mensaje</Label>
          <Textarea
            id="reminder-message"
            value={message}
            onChange={(e) => setDraft(e.target.value)}
            rows={10}
            maxLength={2000}
            className="text-[13px] leading-relaxed"
          />
          {!hasPaymentDetails(payment) && (
            <p className="text-[12px] text-tinta-tenue">
              Agrega tu CLABE o un link de pago en{' '}
              <Link href="/fiscal-profiles" className="text-sello underline underline-offset-2">
                tu perfil fiscal
              </Link>{' '}
              y saldrán aquí y en el PDF.
            </p>
          )}
        </div>

        <div className="space-y-1 text-[12px] text-tinta-tenue">
          {lastReminder && (
            <p>
              Último recordatorio: {formatDate(lastReminder.createdAt, { day: 'numeric', month: 'short' })}, por{' '}
              {lastReminder.channel === 'email' ? 'correo' : 'WhatsApp'}{lastReminder.automatic ? ', automático' : ''}.
            </p>
          )}
          {!phone && <p>Tu cliente no tiene teléfono: en WhatsApp eliges el chat.</p>}
          {!client.email && <p>Para mandarlo por correo, agrega el correo de tu cliente.</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleEmail} disabled={!client.email || isSending || !message.trim()}>
            {isSending ? <Loader2 className="animate-spin" /> : <Mail />}
            {isSending ? 'Enviando…' : 'Enviar por correo'}
          </Button>
          <Button asChild>
            <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" onClick={handleWhatsapp}>
              <MessageCircle />
              Abrir WhatsApp
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
