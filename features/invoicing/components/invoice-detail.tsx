'use client'

import { cn } from '@/lib/utils'
import { setAwaitingPaymentAction } from '@features/collections/actions/set-awaiting-payment.action'
import { CollectionBadge } from '@features/collections/components/collection-label'
import { PueCollectionTalon } from '@features/collections/components/pue-collection-talon'
import { RemindPaymentDialog } from '@features/collections/components/remind-payment-dialog'
import type { LastReminder } from '@features/collections/services/collection.service'
import { isOwed, type CollectionState } from '@features/collections/utils/collection-state'
import type { PaymentDetails } from '@features/collections/utils/reminder-message'
import { InvoicePayments } from '@features/payments/components/invoice-payments'
import { RepeatMonthlyDialog } from '@features/recurring/components/repeat-monthly-dialog'
import type { RecurringSummary } from '@features/recurring/services/recurring.service'
import { dayOfMonthLabel } from '@features/recurring/utils/schedule'
import type { StampingFix } from '@features/stamping/utils/stamping-errors'
import { formatDayLong } from '@features/payments/utils/payment-dates'
import { RegisterPaymentDialog } from '@features/payments/components/register-payment-dialog'
import type { InvoiceBalance, InvoicePayment } from '@features/payments/types/payment.types'
import { countingPayments } from '@features/payments/utils/payment-amounts'
import { Button } from '@shared/ui/button'
import type { ComboboxOption } from '@shared/ui/combobox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu'
import { formatDateLong } from '@shared/utils/date'
import { Ban, BellRing, CalendarSync, CircleDollarSign, Copy, Download, FilePen, Files, Loader2, MoreHorizontal, Pencil, RotateCw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { duplicateInvoiceAction } from '../actions/duplicate-invoice.action'
import { refreshCancellationStatusAction } from '../actions/refresh-cancellation-status.action'
import { stampInvoiceAction } from '../actions/stamp-invoice.action'
import { useCancellationRefresh } from '../hooks/use-cancellation-refresh'
import type { InvoiceRelations, InvoiceWithRelations, RelatedInvoice, ReplacementOutcome } from '../types/invoice.types'
import { cancelledHow, invoiceStampState } from '../utils/cancellation-state'
import { correctionBlockReason } from '../utils/correction'
import { downloadInvoiceFile, type InvoiceFileType } from '../utils/download-invoice-file'
import { invoiceAmounts } from '../utils/invoice-amounts'
import { round2 } from '../utils/cfdi-amounts'
import { formatCurrency } from '../utils/invoice-calculations'
import { numberToSpanishWords } from '../utils/number-to-words'
import { CANCEL_BLOCKED_BY_PAYMENTS } from '../constants/cancellation-reasons'
import { CancelInvoiceDialog } from './cancel-invoice-dialog'
import { CancellationNotice } from './cancellation-notice'
import { CorrectInvoiceDialog } from './correct-invoice-dialog'
import { DeleteInvoiceDialog } from './delete-invoice-dialog'
import { Folio } from './folio'
import { InvoiceHelpDialog } from './invoice-help-dialog'
import { InvoicePreviewDialog } from './invoice-preview-dialog'
import { MissingCsdBanner } from './missing-csd-banner'
import { StampConfirmDialog } from './stamp-confirm-dialog'
import { StatusBadge } from './status-badge'
import { TimbreFiscalSection } from './timbre-fiscal-section'

interface FiscalProfileData {
  id?: string
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
  logoUrl?: string | null
  certSerialNumber?: string | null
  hasCsd?: boolean
  /** "Para que te paguen", for the PDF. */
  payment?: PaymentDetails | null
}

interface InvoiceDetailProps {
  invoice: InvoiceWithRelations
  emisor?: FiscalProfileData | null
  labels: {
    paymentForms: Record<string, string>
    paymentMethods: Record<string, string>
    cfdiUsages: Record<string, string>
    taxRegimes: Record<string, string>
    /** c_Pais names, for a client abroad. */
    countries?: Record<string, string>
  }
  stampsBalance: number
  /** Opens the stamp confirmation on arrival ("Guardar y timbrar" from the form). */
  openStampDialog?: boolean
  /** Payments of a stamped PPD invoice, noted on the talón; absent for PUE invoices and drafts. */
  payments?: {
    list: InvoicePayment[]
    balance: InvoiceBalance
    /** c_FormaPago without 99. */
    paymentFormOptions: ComboboxOption[]
    /** Today in Mexico City, YYYY-MM-DD. */
    today: string
    /** Day the invoice was issued, YYYY-MM-DD. */
    invoiceDay: string
  }
  /** The invoice it replaces, the one that replaces it and a pending correction draft. */
  relations?: InvoiceRelations
  /** Where its collection stands; absent for drafts and invoices no longer valid. */
  collection?: {
    state: CollectionState
    /** Today in Mexico City, YYYY-MM-DD. */
    today: string
    lastReminder: LastReminder | null
    payment: PaymentDetails | null
  }
  /** "Repetir cada mes": the recurring invoice it belongs to, if any. */
  recurring?: {
    summary: RecurringSummary | null
    /** Today in Mexico City, YYYY-MM-DD. */
    today: string
    /** Day the invoice was issued, YYYY-MM-DD (Mexico City). */
    issuedDay: string
  }
}

/** Ink note above the sheet: `info` in stamp blue, `warn` in ochre. */
function SheetNote({ tone, children }: { tone: 'info' | 'warn'; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        'rounded-[4px] px-4 py-3 text-[13px] text-tinta',
        tone === 'warn' ? 'border border-ocre/40 bg-ocre-tenue' : 'bg-sello-tenue',
      )}
    >
      {children}
    </p>
  )
}

function RelatedLink({ related }: { related: RelatedInvoice }) {
  if (!related.id) return <span className="font-mono">…{related.uuid.slice(-8)}</span>
  return (
    <Link href={`/invoices/${related.id}`} className="font-mono text-tinta underline underline-offset-2">
      {related.label}
    </Link>
  )
}

/**
 * Why a correction draft cannot be stamped yet: the invoice it replaces has a pending cancellation,
 * or the client RFC changed (the SAT asks to cancel the original first with motive 02).
 */
function correctionStampBlock(replaces: RelatedInvoice | undefined, clientRfc: string): string | null {
  if (!replaces || replaces.status !== 'timbrada') return null
  if (replaces.cancellationStatus === 'en_proceso') {
    return `La ${replaces.label} tiene una cancelación en proceso. Espera a que el SAT la resuelva para timbrar esta corrección.`
  }
  if (replaces.receiverRfc && replaces.receiverRfc !== clientRfc) {
    return `Cambiaste el RFC del cliente (antes ${replaces.receiverRfc}). Cuando el RFC estaba mal, el SAT pide cancelar primero la ${replaces.label} con el motivo 02 y después timbrar esta.`
  }
  return null
}

/** The toast that tells what happened to the invoice a correction replaces. */
function announceReplacement(replacement: ReplacementOutcome, openInvoice: () => void) {
  if (replacement.outcome === 'cancelada') {
    toast.success(`La ${replacement.label} quedó cancelada`)
  } else if (replacement.outcome === 'en_proceso') {
    toast.success(`Pedimos al SAT cancelar la ${replacement.label}`, {
      description: 'Si tu cliente tiene que aceptarla, verás el estatus en esa factura.',
    })
  } else if (replacement.outcome === 'por_cancelar') {
    toast.warning(`La ${replacement.label} sigue vigente`, {
      description: `${replacement.error ?? 'No se pudo pedir su cancelación.'} Pídela desde esa factura.`,
      action: { label: 'Ver', onClick: openInvoice },
    })
  }
}

function shortDate(date: Date | string) {
  return new Date(date)
    .toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'America/Mexico_City' })
    .replaceAll('/', '·')
}

export function InvoiceDetail({ invoice, emisor, labels, stampsBalance, openStampDialog, payments, relations, collection, recurring }: InvoiceDetailProps) {
  const router = useRouter()
  const [isStamping, startStamping] = useTransition()
  const [isDuplicating, startDuplicating] = useTransition()
  const [stampDialogOpen, setStampDialogOpen] = useState(!!openStampDialog)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [correctOpen, setCorrectOpen] = useState(false)
  const [remindOpen, setRemindOpen] = useState(false)
  const [ppdOpen, setPpdOpen] = useState(false)
  const [repeatOpen, setRepeatOpen] = useState(false)
  const [isMarking, startMarking] = useTransition()
  // The stamp lands with an impression only right after the user stamps, not on every visit.
  const [justStamped, setJustStamped] = useState(false)

  const invoiceLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada'
  const isCancelled = invoice.status === 'cancelada'
  const missingCsd = isDraft && !!emisor?.id && !emisor.hasCsd
  const amounts = invoiceAmounts(invoice)
  const hasWithholdings = amounts.withholdings > 0
  const hasActivePayments = !!payments?.list.some((payment) => payment.status !== 'cancelado')
  const stampState = invoiceStampState(invoice)
  const correctBlocked = isStamped ? correctionBlockReason(invoice, { hasActivePayments }) : null
  const cancelBlocked = hasActivePayments
    ? CANCEL_BLOCKED_BY_PAYMENTS
    : stampState === 'en_cancelacion'
      ? 'Ya pediste cancelarla. Espera la respuesta del SAT o actualiza su estatus.'
      : undefined
  const owed = isOwed(collection?.state ?? null)
  // A PUE invoice is paid when stamped unless the user says it is not (yet).
  const canMarkAwaiting = invoice.paymentMethod === 'PUE' && collection?.state.status === 'cobrada'
  const pueAwaiting = invoice.paymentMethod === 'PUE' && owed
  const replaces = relations?.replaces
  const stampBlocked = isDraft ? correctionStampBlock(replaces, invoice.client.rfc) : null
  const replacesPending = isDraft && replaces?.status === 'timbrada' && !stampBlocked

  // While the SAT has not resolved a cancellation, opening the invoice asks again (at most once a minute).
  const refreshStatus = useCallback(async () => {
    const result = await refreshCancellationStatusAction(invoice.id)
    return result.success && result.decision !== 'unchanged'
  }, [invoice.id])
  useCancellationRefresh(refreshStatus, stampState === 'en_cancelacion', invoice.satCheckedAt)
  // A new payment waits until none is being stamped, so installments never skip a number, and
  // until the SAT resolves the cancellation of one, so the balance is known.
  const canRegisterPayment = isStamped && !!payments && payments.balance.balance > 0
    && !payments.list.some((payment) => payment.status === 'en_timbrado')
    && !countingPayments(payments.list).some((payment) => payment.cancellationStatus === 'en_proceso')

  /** The button on a failed stamping's toast: where the user fixes what the SAT rejected. */
  const stampErrorAction = (code: string | undefined, fix: StampingFix | undefined) => {
    if (code === 'NO_STAMPS') return { label: 'Comprar timbres', onClick: () => router.push('/billing') }
    switch (fix) {
      case 'client':
        return { label: 'Ir a Clientes', onClick: () => router.push('/clients') }
      case 'profile':
        return { label: 'Ir a Perfiles fiscales', onClick: () => router.push('/fiscal-profiles') }
      case 'invoice':
        return { label: 'Editar borrador', onClick: () => router.push(`/invoices/${invoice.id}/edit`) }
      default:
        return undefined
    }
  }

  const handleStamp = () => {
    startStamping(async () => {
      const result = await stampInvoiceAction(invoice.id)
      if (result.success) {
        setJustStamped(true)
        toast.success('Factura timbrada', {
          description: invoice.client.email
            ? `Enviamos el XML y el PDF a ${invoice.client.email}.`
            : 'Ya puedes descargar el XML y el PDF.',
        })
        const replacement = result.replacement
        if (replacement) announceReplacement(replacement, () => router.push(`/invoices/${replacement.invoiceId}`))
        router.refresh()
      } else {
        toast.error('No se timbró la factura', {
          description: result.error,
          // An explained rejection takes longer to read than a one-liner.
          duration: result.fix ? 15_000 : undefined,
          action: stampErrorAction(result.code, result.fix),
        })
      }
    })
  }

  const handleDuplicate = () => {
    startDuplicating(async () => {
      const result = await duplicateInvoiceAction(invoice.id)
      if (result.success) {
        toast.success('Borrador creado a partir de esta factura')
        router.push(`/invoices/${result.invoiceId}/edit`)
      } else {
        toast.error('No se pudo duplicar', { description: result.error })
      }
    })
  }

  const handleMarkAwaiting = () => {
    startMarking(async () => {
      const result = await setAwaitingPaymentAction(invoice.id, true)
      if (!result.success) {
        toast.error('No se marcó por cobrar', { description: result.error })
        return
      }
      toast.success('Factura por cobrar', { description: 'La verás en «Te deben» hasta que marques que te pagaron.' })
      router.refresh()
    })
  }

  const handleCopyUuid = () => {
    if (!invoice.uuid) return
    navigator.clipboard.writeText(invoice.uuid)
    toast.success('UUID copiado')
  }

  const handleDownload = async (type: InvoiceFileType) => {
    const ok = await downloadInvoiceFile(invoice, type)
    if (!ok) toast.error('El archivo aún no está disponible', { description: 'Recarga la página en unos segundos.' })
  }

  return (
    <div className="space-y-5">
      {missingCsd && emisor?.id && <MissingCsdBanner profileId={emisor.id} profileName={emisor.businessName} />}

      {/* Title and actions side by side when both fit; otherwise the actions go below, together */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="whitespace-nowrap text-[22px] font-semibold tracking-tight">
            Factura <Folio serie={invoice.serie} folio={invoice.folio} className="font-medium" />
          </h1>
          <StatusBadge invoice={invoice} />
          <CollectionBadge state={collection?.state ?? null} />
          <InvoiceHelpDialog status={invoice.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDraft && (
            <>
              <DeleteInvoiceDialog invoiceId={invoice.id} invoiceLabel={invoiceLabel} />
              <InvoicePreviewDialog invoice={invoice} emisor={emisor} labels={labels} />
              <Button variant="outline" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Pencil />
                  Editar
                </Link>
              </Button>
              <StampConfirmDialog
                open={stampDialogOpen}
                onOpenChange={setStampDialogOpen}
                onConfirm={handleStamp}
                disabled={isStamping || missingCsd || !!stampBlocked}
                disabledReason={stampBlocked ?? 'Sube tu CSD para poder timbrar'}
                replacesLabel={replacesPending ? replaces?.label ?? undefined : undefined}
                currency={invoice.currency}
                isStamping={isStamping}
                clientName={invoice.client.businessName}
                clientEmail={invoice.client.email}
                total={amounts.total}
                hasWithholdings={hasWithholdings}
                stampsBalance={stampsBalance}
              />
            </>
          )}
          {(isStamped || isCancelled) && (
            <>
              <Button variant="ghost" onClick={handleDuplicate} disabled={isDuplicating}>
                {isDuplicating ? <Loader2 className="animate-spin" /> : <Files />}
                Duplicar
              </Button>
              {(invoice.xmlUrl || invoice.xmlContent) && (
                <Button variant="outline" onClick={() => handleDownload('xml')}>
                  <Download />
                  XML
                </Button>
              )}
              {invoice.pdfUrl && (
                <Button variant="outline" onClick={() => handleDownload('pdf')}>
                  <Download />
                  PDF
                </Button>
              )}
              {isCancelled && invoice.cancellationAcuseUrl && (
                <Button variant="outline" onClick={() => handleDownload('acuse')}>
                  <Download />
                  Acuse
                </Button>
              )}
              {isStamped && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Más acciones">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {invoice.uuid && (
                      <DropdownMenuItem onClick={handleCopyUuid}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar UUID
                      </DropdownMenuItem>
                    )}
                    {canMarkAwaiting && (
                      <DropdownMenuItem onClick={handleMarkAwaiting} disabled={isMarking}>
                        <CircleDollarSign className="mr-2 h-4 w-4" />
                        Marcar por cobrar
                      </DropdownMenuItem>
                    )}
                    {recurring && !invoice.recurringInvoiceId && (
                      <DropdownMenuItem onClick={() => setRepeatOpen(true)}>
                        <CalendarSync className="mr-2 h-4 w-4" />
                        Repetir cada mes
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {stampState === 'en_cancelacion' ? (
                      <DropdownMenuItem onClick={() => refreshStatus().then((changed) => (changed ? router.refresh() : toast('Sigue en proceso')))}>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Actualizar estatus
                      </DropdownMenuItem>
                    ) : stampState === 'por_cancelar' || stampState === 'cancelacion_rechazada' ? (
                      <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-destructive focus:text-destructive">
                        <Ban className="mr-2 h-4 w-4" />
                        {stampState === 'por_cancelar' ? 'Pedir cancelación' : 'Volver a pedir la cancelación'}
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => setCorrectOpen(true)}>
                          <FilePen className="mr-2 h-4 w-4" />
                          Corregir factura
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCancelOpen(true)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Cancelar factura
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {isStamped && (
                <>
                  <CancelInvoiceDialog
                    invoiceId={invoice.id}
                    invoiceLabel={invoiceLabel}
                    open={cancelOpen}
                    onOpenChange={setCancelOpen}
                    blockedReason={cancelBlocked}
                    substituteUuid={invoice.cancellationSubstituteUuid}
                    defaultReason={invoice.cancellationReason}
                    rejectedBefore={stampState === 'cancelacion_rechazada'}
                  />
                  <CorrectInvoiceDialog
                    invoiceId={invoice.id}
                    invoiceLabel={invoiceLabel}
                    open={correctOpen}
                    onOpenChange={setCorrectOpen}
                    blockedReason={correctBlocked}
                  />
                </>
              )}
              {isStamped && recurring && !invoice.recurringInvoiceId && (
                <RepeatMonthlyDialog
                  open={repeatOpen}
                  onOpenChange={setRepeatOpen}
                  today={recurring.today}
                  clientName={invoice.client.businessName}
                  invoice={{ id: invoice.id, issuedDay: recurring.issuedDay, descriptions: invoice.items.map((item) => item.description) }}
                />
              )}
              {owed && (
                <Button variant="outline" onClick={() => setRemindOpen(true)}>
                  <BellRing />
                  Recordar pago
                </Button>
              )}
              {owed && collection && (
                <RemindPaymentDialog
                  invoiceId={invoice.id}
                  invoiceLabel={invoiceLabel}
                  client={invoice.client}
                  currency={invoice.currency}
                  total={amounts.total}
                  state={collection.state}
                  today={collection.today}
                  payment={collection.payment}
                  lastReminder={collection.lastReminder}
                  open={remindOpen}
                  onOpenChange={setRemindOpen}
                />
              )}
              {pueAwaiting && (
                <CorrectInvoiceDialog
                  invoiceId={invoice.id}
                  invoiceLabel={invoiceLabel}
                  open={ppdOpen}
                  onOpenChange={setPpdOpen}
                  blockedReason={correctBlocked}
                  toPpd
                />
              )}
              {canRegisterPayment && payments && (
                <RegisterPaymentDialog
                  invoiceId={invoice.id}
                  clientName={invoice.client.businessName}
                  clientEmail={invoice.client.email}
                  balance={payments.balance}
                  paymentFormOptions={payments.paymentFormOptions}
                  stampsBalance={stampsBalance}
                  today={payments.today}
                  invoiceDay={payments.invoiceDay}
                  currency={invoice.currency}
                />
              )}
            </>
          )}
        </div>
      </div>

      {isStamped && (
        <CancellationNotice invoice={invoice} replacedBy={relations?.replacedBy} onRequest={() => setCancelOpen(true)} />
      )}
      {recurring?.summary && (
        <SheetNote tone="info">
          {recurring.summary.active ? (
            <>
              {isDraft ? 'Este borrador salió de una factura que se repite' : 'Esta factura se repite'} {dayOfMonthLabel(recurring.summary.dayOfMonth)} de cada mes
              {recurring.summary.mode === 'stamp' ? ' y se timbra sola' : ''}. La siguiente sale el {formatDayLong(recurring.summary.nextRunOn)}.{' '}
            </>
          ) : (
            <>Esta factura se repetía cada mes; la repetición está en pausa.{' '}</>
          )}
          <Link href="/invoices/recurring" className="underline underline-offset-2">
            Ver facturas de cada mes
          </Link>
        </SheetNote>
      )}
      {isStamped && stampState === 'timbrada' && relations?.correctionDraft && (
        <SheetNote tone="info">
          Tienes un borrador que corrige esta factura:{' '}
          <Link href={`/invoices/${relations.correctionDraft.id}`} className="font-mono underline underline-offset-2">
            {relations.correctionDraft.label}
          </Link>
          . Al timbrarlo, pediremos al SAT cancelar esta.
        </SheetNote>
      )}
      {isDraft && replaces && (
        <SheetNote tone={stampBlocked ? 'warn' : 'info'}>
          {stampBlocked ?? (
            replacesPending ? (
              <>
                Este borrador corrige la factura <RelatedLink related={replaces} />. Al timbrarlo, pediremos al SAT
                cancelar la {replaces.label ?? 'original'} con el motivo 01.
              </>
            ) : (
              <>
                Este borrador corrige la factura <RelatedLink related={replaces} />, que ya está cancelada; al timbrarlo
                no hay nada más que cancelar.
              </>
            )
          )}
          {stampBlocked && replaces.id && (
            <>
              {' '}
              <Link href={`/invoices/${replaces.id}`} className="font-medium underline underline-offset-2">
                Ir a la {replaces.label}
              </Link>
            </>
          )}
        </SheetNote>
      )}

      {/* The document */}
      <article className={cn('relative overflow-hidden', isDraft ? 'hoja-borrador' : 'hoja')}>
        {/* Header band: issuer and folio */}
        <header className="guilloche flex flex-col gap-5 border-b border-renglon px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-8">
          <div className="flex min-w-0 items-start gap-3">
            {emisor?.logoUrl && (
              <Image
                src={emisor.logoUrl}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-[4px] object-contain"
              />
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight tracking-tight">{emisor?.businessName ?? 'Sin perfil emisor'}</p>
              {emisor && (
                <p className="mt-1 text-[13px] text-tinta-tenue">
                  <span className="font-mono">{emisor.rfc}</span>
                  {' · '}
                  {labels.taxRegimes[emisor.taxRegime] ?? `Régimen ${emisor.taxRegime}`}
                  {' · Expedida en CP '}
                  <span className="font-mono">{emisor.postalCode}</span>
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[13px] text-tinta-tenue">Factura de ingreso</p>
            <Folio serie={invoice.serie} folio={invoice.folio} tone="roja" className="text-2xl" />
            <p className="mt-1 text-[13px] text-tinta-tenue">
              {isDraft ? 'La fecha se pone al timbrar' : formatDateLong(invoice.issuedAt)}
            </p>
            {replaces && (
              <p className="mt-1 text-[12px] text-tinta-tenue">
                Sustituye a <RelatedLink related={replaces} />
              </p>
            )}
            {relations?.replacedBy && (
              <p className="mt-1 text-[12px] text-tinta-tenue">
                Sustituida por <RelatedLink related={relations.replacedBy} />
              </p>
            )}
          </div>
        </header>

        <div className="space-y-8 px-5 py-6 sm:px-8">
          {/* Receptor and payment data */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[13px] text-tinta-tenue">Para</p>
              <p className="mt-1 font-medium">{invoice.client.businessName}</p>
              <p className="mt-0.5 text-[13px] text-tinta-tenue">
                <span className="font-mono">{invoice.client.rfc}</span>
                {invoice.client.country ? (
                  <>
                    {' · '}
                    {labels.countries?.[invoice.client.country] ?? invoice.client.country}
                    {invoice.client.foreignTaxId && <> · <span className="font-mono">{invoice.client.foreignTaxId}</span></>}
                  </>
                ) : (
                  <>
                    {' · CP '}
                    <span className="font-mono">{invoice.client.postalCode}</span>
                  </>
                )}
              </p>
              {invoice.client.taxRegime && (
                <p className="text-[13px] text-tinta-tenue">
                  {labels.taxRegimes[invoice.client.taxRegime] ?? `Régimen ${invoice.client.taxRegime}`}
                </p>
              )}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
              <dt className="text-tinta-tenue">Uso</dt>
              <dd>
                <span className="font-mono">{invoice.cfdiUsage}</span> {labels.cfdiUsages[invoice.cfdiUsage]}
              </dd>
              <dt className="text-tinta-tenue">Forma de pago</dt>
              <dd>
                <span className="font-mono">{invoice.paymentForm}</span> {labels.paymentForms[invoice.paymentForm]}
              </dd>
              <dt className="text-tinta-tenue">Método</dt>
              <dd>
                <span className="font-mono">{invoice.paymentMethod}</span> {labels.paymentMethods[invoice.paymentMethod]}
              </dd>
              <dt className="text-tinta-tenue">Moneda</dt>
              <dd className="font-mono">{invoice.currency}</dd>
              {invoice.currency !== 'MXN' && invoice.exchangeRate && (
                <>
                  <dt className="text-tinta-tenue">Tipo de cambio</dt>
                  <dd className="font-mono">
                    {Number(invoice.exchangeRate)}
                    {isDraft && invoice.exchangeRateSource === 'dof' && (
                      <span className="ml-1.5 font-sans text-tinta-tenue">se actualiza al timbrar</span>
                    )}
                  </dd>
                </>
              )}
            </dl>
          </div>

          {/* Conceptos */}
          <div>
            <div className="hidden grid-cols-[1fr_72px_128px_128px] gap-4 border-b border-tinta/70 pb-2 text-[13px] text-tinta-tenue md:grid">
              <span>Concepto</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">Valor unitario</span>
              <span className="text-right">Importe</span>
            </div>
            <ul className="divide-y divide-renglon border-b border-renglon md:border-b-0">
              {invoice.items.map((item, index) => {
                const concept = amounts.concepts[index]
                return (
                  <li key={item.id} className="grid grid-cols-2 gap-x-4 gap-y-1 py-3 md:grid-cols-[1fr_72px_128px_128px]">
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-sm">{item.description}</p>
                      <p className="mt-0.5 font-mono text-[12px] text-tinta-tenue">
                        {item.productServiceCode} · {item.unit}
                      </p>
                    </div>
                    <p className="font-mono text-[13px] text-tinta-tenue md:text-right md:text-sm md:text-tinta">
                      <span className="md:hidden">Cant. </span>
                      {parseFloat(item.quantity).toLocaleString('es-MX')}
                      <span className="md:hidden"> × {formatCurrency(concept?.unitValue ?? 0, invoice.currency)}</span>
                    </p>
                    <p className="hidden text-right font-mono text-sm md:block">{formatCurrency(concept?.unitValue ?? 0, invoice.currency)}</p>
                    <p className="text-right font-mono text-sm">{formatCurrency(concept?.base ?? 0, invoice.currency)}</p>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Totals, with the stamp beside them */}
          <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-h-[96px] items-center sm:pl-4">
              {isStamped && (
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    className={cn('sello text-sello', justStamped && 'sello-impresion')}
                    aria-label={`Timbrada el ${invoice.stampedAt ? formatDateLong(invoice.stampedAt) : ''}`}
                  >
                    <span className="sello-titulo">Timbrada</span>
                    {invoice.stampedAt && <span className="text-[12px]">{shortDate(invoice.stampedAt)}</span>}
                    {invoice.uuid && <span className="text-[11px] opacity-80">UUID …{invoice.uuid.slice(-4)}</span>}
                  </div>
                  {/* A second, pending stamp in ochre while the SAT has not cancelled it */}
                  {stampState === 'en_cancelacion' && (
                    <div
                      className="sello border-dashed text-ocre"
                      style={{ ['--sello-rot' as string]: '3deg', boxShadow: 'none' }}
                      aria-label="Cancelación en proceso"
                    >
                      <span className="sello-titulo">En cancelación</span>
                      {invoice.cancellationRequestedAt && <span className="text-[12px]">{shortDate(invoice.cancellationRequestedAt)}</span>}
                      {invoice.cancellationReason && <span className="text-[11px] opacity-80">Motivo {invoice.cancellationReason}</span>}
                    </div>
                  )}
                </div>
              )}
              {isCancelled && (
                <div className="sello text-tinta-roja" style={{ ['--sello-rot' as string]: '4deg' }}>
                  <span className="sello-titulo">Cancelada</span>
                  {invoice.cancelledAt && <span className="text-[12px]">{shortDate(invoice.cancelledAt)}</span>}
                  {invoice.cancellationReason && <span className="text-[11px] opacity-80">Motivo {invoice.cancellationReason}</span>}
                  {cancelledHow(invoice.satCancellationStatus) && (
                    <span className="text-[11px] opacity-80">{cancelledHow(invoice.satCancellationStatus)}</span>
                  )}
                </div>
              )}
              {isDraft && (
                <p className="max-w-[220px] text-[13px] text-tinta-tenue">
                  Borrador sin validez fiscal hasta que lo timbres.
                </p>
              )}
            </div>

            <div className="w-full sm:max-w-xs">
              <dl className="space-y-1.5 text-sm">
                <AmountRow label="Subtotal" value={amounts.subtotal} currency={invoice.currency} />
                <AmountRow label={`IVA ${Number(invoice.ivaRate) === 0 ? 0 : 16} %`} value={amounts.iva} currency={invoice.currency} />
                {amounts.isrWithheld > 0 && <AmountRow label="Retención ISR" value={-amounts.isrWithheld} currency={invoice.currency} />}
                {amounts.ivaWithheld > 0 && <AmountRow label="Retención IVA" value={-amounts.ivaWithheld} currency={invoice.currency} />}
              </dl>
              <div className="mt-3 flex items-baseline justify-between border-t border-tinta/70 pt-3">
                <span className="text-sm font-medium">{hasWithholdings ? 'Neto a recibir' : 'Total'}</span>
                <span className="font-mono text-2xl font-medium tracking-tight">{formatCurrency(amounts.total, invoice.currency)}</span>
              </div>
              {invoice.currency !== 'MXN' && invoice.exchangeRate && (
                <p className="mt-1 text-right text-[12px] text-tinta-tenue">
                  Son <span className="font-mono">{formatCurrency(round2(amounts.total * Number(invoice.exchangeRate)))}</span>
                </p>
              )}
              <p className="mt-2 text-[12px] leading-snug text-tinta-tenue">{numberToSpanishWords(amounts.total, invoice.currency)}</p>
            </div>
          </div>

          {/* Timbre fiscal digital */}
          {(isStamped || isCancelled) && (invoice.cfdiSignature || invoice.satSignature || invoice.qrCode) && (
            <TimbreFiscalSection invoice={invoice} emisor={emisor} />
          )}

          {(isStamped || isCancelled) && invoice.uuid && (
            <button
              type="button"
              onClick={handleCopyUuid}
              className="inline-flex items-center gap-1.5 font-mono text-[12px] text-tinta-tenue transition-colors hover:text-tinta"
            >
              <Copy className="h-3 w-3" />
              Copiar UUID
            </button>
          )}
        </div>

        {payments && (isStamped || payments.list.length > 0) && (
          <InvoicePayments
            invoiceId={invoice.id}
            payments={payments.list}
            balance={payments.balance}
            paymentForms={labels.paymentForms}
            currency={invoice.currency}
            due={collection?.state.dueDate ? { date: collection.state.dueDate, today: collection.today } : undefined}
            correction={isStamped ? {
              clientName: invoice.client.businessName,
              clientEmail: invoice.client.email,
              paymentFormOptions: payments.paymentFormOptions,
              stampsBalance,
              today: payments.today,
              invoiceDay: payments.invoiceDay,
            } : undefined}
          />
        )}
        {pueAwaiting && collection && (
          <PueCollectionTalon
            invoiceId={invoice.id}
            state={collection.state}
            currency={invoice.currency}
            today={collection.today}
            onRemind={() => setRemindOpen(true)}
            onReplaceWithPpd={() => setPpdOpen(true)}
          />
        )}
      </article>
    </div>
  )
}

function AmountRow({ label, value, currency = 'MXN' }: { label: string; value: number; currency?: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-tinta-tenue">{label}</dt>
      <dd className="font-mono">{value < 0 ? `−${formatCurrency(-value, currency)}` : formatCurrency(value, currency)}</dd>
    </div>
  )
}
