'use client'

import { cn } from '@/lib/utils'
import { Folio } from '@features/invoicing/components/folio'
import { dueLabel } from '@features/collections/utils/due-date'
import { useCancellationRefresh } from '@features/invoicing/hooks/use-cancellation-refresh'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import { SectionLabel } from '@shared/components/section-label'
import { Button } from '@shared/ui/button'
import type { ComboboxOption } from '@shared/ui/combobox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { Ban, Download, FilePen, Loader2, MoreHorizontal, RotateCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { refreshPaymentCancellationsAction } from '../actions/refresh-payment-cancellations.action'
import { retryPaymentStampAction } from '../actions/retry-payment-stamp.action'
import type { InvoiceBalance, InvoicePayment } from '../types/payment.types'
import { downloadPaymentFile } from '../utils/download-payment-file'
import { countingPayments } from '../utils/payment-amounts'
import { formatDay } from '../utils/payment-dates'
import { CancelPaymentDialog } from './cancel-payment-dialog'
import { RegisterPaymentDialog } from './register-payment-dialog'

interface InvoicePaymentsProps {
  invoiceId: string
  payments: InvoicePayment[]
  balance: InvoiceBalance
  paymentForms: Record<string, string>
  /** Currency of the invoice and its payments. */
  currency?: string
  /** When the invoice is due; `today` is Mexico City's, YYYY-MM-DD. */
  due?: { date: string; today: string }
  /** What "Corregir cobro" needs; without it the talón only lists. */
  correction?: {
    clientName: string
    clientEmail?: string | null
    paymentFormOptions: ComboboxOption[]
    stampsBalance: number
    today: string
    invoiceDay: string
  }
}

/** "P-2" */
function paymentLabel(payment: InvoicePayment) {
  return `${payment.serie}-${payment.folio}`
}

/**
 * The talón: the stub of the invoice sheet, past a perforated line, where the payments of a PPD
 * invoice are noted with their complementos de pago, and what is still owed. The last payment can
 * be corrected or cancelled from here.
 */
export function InvoicePayments({ invoiceId, payments, balance, paymentForms, currency = 'MXN', due, correction }: InvoicePaymentsProps) {
  const isPaid = balance.balance <= 0
  const counting = countingPayments(payments)
  const last = counting.at(-1)
  const editable = last && last.status === 'timbrado' && !last.cancellationStatus && !last.cancellationSubstituteUuid ? last : null
  const cancellationPending = counting.some((payment) => payment.cancellationStatus === 'en_proceso')
  const [correctOpen, setCorrectOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<InvoicePayment | null>(null)

  // While the SAT has not resolved a cancellation, opening the invoice asks again.
  const refreshPending = useCallback(
    async () => (await refreshPaymentCancellationsAction(invoiceId)).changed > 0,
    [invoiceId],
  )
  useCancellationRefresh(refreshPending, payments.some((payment) => payment.cancellationStatus === 'en_proceso'))

  return (
    <section className="talon space-y-3 px-5 pb-6 pt-7 sm:px-8" aria-label="Cobros de la factura">
      <SectionLabel>Cobros</SectionLabel>

      {payments.length === 0 ? (
        <p className="text-[13px] text-tinta-tenue">
          Aún no registras cobros. Cuando te paguen, registra el cobro y timbramos su complemento de pago.
        </p>
      ) : (
        <ul className="divide-y divide-renglon">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              invoiceId={invoiceId}
              payment={payment}
              paymentForms={paymentForms}
              replacedBy={payments.find((other) => other.relatedUuid && other.relatedUuid === payment.uuid && other.status !== 'cancelado')}
              editable={!!correction && payment.id === editable?.id}
              onCorrect={() => setCorrectOpen(true)}
              onCancel={() => setCancelTarget(payment)}
            />
          ))}
        </ul>
      )}

      {cancellationPending && (
        <p className="rounded-[4px] border border-ocre/40 bg-ocre-tenue px-3 py-2 text-[13px] text-tinta">
          Hay una cancelación de cobro en proceso. Cuando el SAT la resuelva podrás registrar el siguiente cobro.
        </p>
      )}

      <div className="flex items-baseline justify-between gap-4 border-t border-tinta/70 pt-3">
        <span className="text-sm font-medium">{isPaid ? 'Saldo' : 'Saldo pendiente'}</span>
        {isPaid ? (
          <span className="sello-mini text-sello">Pagada</span>
        ) : (
          <span className="font-mono text-lg font-medium tracking-tight">{formatCurrency(balance.balance, currency)}</span>
        )}
      </div>
      {balance.paid > 0 && !isPaid && (
        <p className="text-right text-[12px] text-tinta-tenue">
          Cobrado <span className="font-mono">{formatCurrency(balance.paid, currency)}</span> de{' '}
          <span className="font-mono">{formatCurrency(balance.total, currency)}</span>
        </p>
      )}
      {due && !isPaid && (
        <p className={cn('text-right text-[12px]', due.date < due.today ? 'text-tinta-roja' : 'text-tinta-tenue')}>
          {dueLabel(due.date, due.today)} · <span className="font-mono">{formatDay(due.date)}</span>
        </p>
      )}

      {correction && editable && (
        <RegisterPaymentDialog
          invoiceId={invoiceId}
          clientName={correction.clientName}
          clientEmail={correction.clientEmail}
          balance={{
            total: balance.total,
            paid: balance.paid - Number(editable.amountPaid),
            balance: Number(editable.previousBalance),
            nextInstallment: editable.installment,
          }}
          paymentFormOptions={correction.paymentFormOptions}
          stampsBalance={correction.stampsBalance}
          today={correction.today}
          invoiceDay={correction.invoiceDay}
          currency={currency}
          correcting={{
            paymentId: editable.id,
            label: paymentLabel(editable),
            paidOn: editable.paidOn,
            paymentForm: editable.paymentForm,
            amount: Number(editable.amountPaid),
            operationNumber: editable.operationNumber,
            exchangeRate: editable.exchangeRate ? Number(editable.exchangeRate) : null,
          }}
          open={correctOpen}
          onOpenChange={setCorrectOpen}
        />
      )}
      {cancelTarget && (
        <CancelPaymentDialog
          paymentId={cancelTarget.id}
          invoiceId={invoiceId}
          paymentLabel={paymentLabel(cancelTarget)}
          open
          onOpenChange={(open) => !open && setCancelTarget(null)}
          substituteUuid={cancelTarget.cancellationSubstituteUuid}
          rejectedBefore={cancelTarget.cancellationStatus === 'rechazada'}
          defaultReason={cancelTarget.cancellationReason}
        />
      )}
    </section>
  )
}

function PaymentRow({
  invoiceId,
  payment,
  paymentForms,
  replacedBy,
  editable,
  onCorrect,
  onCancel,
}: {
  invoiceId: string
  payment: InvoicePayment
  paymentForms: Record<string, string>
  /** The complemento that replaces this one. */
  replacedBy?: InvoicePayment
  /** The last payment: it can be corrected or cancelled. */
  editable: boolean
  onCorrect: () => void
  onCancel: () => void
}) {
  const router = useRouter()
  const [isRetrying, startRetrying] = useTransition()
  const [isRefreshing, startRefreshing] = useTransition()
  const isStamped = payment.status === 'timbrado'
  const pendingRequest = isStamped && !payment.cancellationStatus && !!payment.cancellationSubstituteUuid
  const rejected = isStamped && payment.cancellationStatus === 'rechazada'

  const handleDownload = async (type: 'xml' | 'pdf') => {
    const ok = await downloadPaymentFile(payment, type)
    if (!ok) toast.error('El archivo aún no está disponible', { description: 'Recarga la página en unos segundos.' })
  }

  const handleRetry = () => {
    startRetrying(async () => {
      const result = await retryPaymentStampAction(payment.id, invoiceId)
      if (result.success) {
        toast.success('Complemento timbrado')
      } else {
        toast.error('No se timbró el complemento', { description: result.error })
      }
      router.refresh()
    })
  }

  const handleRefresh = () => {
    startRefreshing(async () => {
      const result = await refreshPaymentCancellationsAction(invoiceId, true)
      if (!result.success) toast.error('No pudimos consultar al SAT', { description: 'Intenta en unos minutos.' })
      else if (result.changed === 0) toast('Sigue en proceso', { description: 'El SAT aún no tiene respuesta de tu cliente.' })
      router.refresh()
    })
  }

  return (
    <li className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-2 py-3 md:grid-cols-[1fr_120px_auto] md:items-center">
      <div className="min-w-0">
        <p className="text-sm">
          Parcialidad {payment.installment}
          <span className="text-tinta-tenue"> · {formatDay(payment.paidOn)}</span>
          {payment.currency !== 'MXN' && payment.exchangeRate && (
            <span className="whitespace-nowrap text-tinta-tenue">
              {' · '}tipo de cambio <span className="font-mono">{Number(payment.exchangeRate)}</span>
            </span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-tinta-tenue">
          <span className="font-mono">{payment.paymentForm}</span> {paymentForms[payment.paymentForm]}
          {payment.operationNumber && (
            <>
              {' · '}
              <span className="font-mono">{payment.operationNumber}</span>
            </>
          )}
        </p>
        <p className="mt-0.5 text-[12px] text-tinta-tenue">
          <span className="whitespace-nowrap">
            Complemento <Folio serie={payment.serie} folio={payment.folio} className="text-[12px] text-tinta-tenue" />
          </span>
          {payment.uuid && <span className="whitespace-nowrap font-mono"> · UUID …{payment.uuid.slice(-4)}</span>}
          {replacedBy && (
            <span className="whitespace-nowrap"> · sustituido por <span className="font-mono">{paymentLabel(replacedBy)}</span></span>
          )}
        </p>
      </div>

      <div className="text-right">
        <p className={cn('font-mono text-sm', (replacedBy || payment.status === 'cancelado') && 'text-tinta-tenue line-through')}>
          {formatCurrency(Number(payment.amountPaid), payment.currency)}
        </p>
        <p className="mt-0.5 text-[12px] text-tinta-tenue">
          saldo <span className="font-mono">{formatCurrency(Number(payment.remainingBalance), payment.currency)}</span>
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-center justify-end gap-2 md:col-span-1">
        <PaymentStatus payment={payment} />
        {isStamped && (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleDownload('xml')} aria-label={`XML del complemento ${paymentLabel(payment)}`}>
              <Download />
              XML
            </Button>
            {payment.pdfUrl && (
              <Button variant="ghost" size="sm" onClick={() => handleDownload('pdf')} aria-label={`PDF del complemento ${paymentLabel(payment)}`}>
                <Download />
                PDF
              </Button>
            )}
          </>
        )}
        {payment.unconfirmed && (
          <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? <Loader2 className="animate-spin" /> : <RotateCw />}
            Reintentar
          </Button>
        )}
        {isStamped && payment.cancellationStatus === 'en_proceso' && (
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="animate-spin" /> : <RotateCw />}
            Actualizar
          </Button>
        )}
        {(pendingRequest || rejected) && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            <Ban />
            {pendingRequest ? 'Pedir cancelación' : 'Volver a pedirla'}
          </Button>
        )}
        {editable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Acciones del cobro ${paymentLabel(payment)}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onCorrect}>
                <FilePen className="mr-2 h-4 w-4" />
                Corregir cobro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCancel} className="text-destructive focus:text-destructive">
                <Ban className="mr-2 h-4 w-4" />
                Cancelar cobro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  )
}

/**
 * Mini stamp of a complemento: stamp ink once stamped, ochre while something is pending with the
 * SAT (an unconfirmed stamping or a cancellation), red once cancelled.
 */
function PaymentStatus({ payment }: { payment: InvoicePayment }) {
  const { label, tone } =
    payment.status === 'cancelado'
      ? { label: 'Cancelado', tone: 'text-tinta-roja' }
      : payment.status === 'en_timbrado'
        ? payment.unconfirmed
          ? { label: 'Sin confirmar', tone: 'text-ocre' }
          : { label: 'Timbrando', tone: 'border-dashed text-tinta-tenue' }
        : payment.cancellationStatus === 'en_proceso'
          ? { label: 'En cancelación', tone: 'border-dashed text-ocre' }
          : payment.cancellationStatus === 'rechazada'
            ? { label: 'Cancelación rechazada', tone: 'text-ocre' }
            : payment.cancellationSubstituteUuid
              ? { label: 'Por cancelar', tone: 'text-ocre' }
              : { label: 'Timbrado', tone: 'text-sello' }

  return <span className={cn('sello-mini', tone)}>{label}</span>
}
