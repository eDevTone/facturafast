import type { Invoice } from '@features/invoicing/types/invoice.types'
import { invoiceStampState } from '@features/invoicing/utils/cancellation-state'
import { round2 } from '@features/invoicing/utils/cfdi-amounts'
import { formatCfdiDate } from '@features/stamping/utils/cfdi-xml'
import { endOfMonth } from '@shared/utils/day'

export type CollectionStatus = 'por_cobrar' | 'parcial' | 'cobrada' | 'vencida'

export type CollectionInvoice = Pick<
  Invoice,
  'status' | 'cancellationStatus' | 'cancellationSubstituteUuid' | 'paymentMethod' | 'dueDate' | 'awaitingPayment' | 'issuedAt'
>

export interface CollectionState {
  status: CollectionStatus
  /** Still owed, in the invoice currency. */
  balance: number
  /** Collected so far: with complementos de pago (PPD), or all of it (a paid PUE). */
  paid: number
  /**
   * Day it has to be paid by. A PUE awaiting payment never goes past the end of the month it was
   * issued, even when its days of credit would.
   */
  dueDate: string | null
  /**
   * A PUE not paid by the end of the month it was issued: the SAT asks to cancel it and issue a
   * PPD invoice that replaces it (RMF 2026, regla 2.7.1.39).
   */
  pueExpired: boolean
}

export const COLLECTION_LABELS: Record<CollectionStatus, string> = {
  por_cobrar: 'Por cobrar',
  parcial: 'Parcial',
  cobrada: 'Cobrada',
  vencida: 'Vencida',
}

/** Day an invoice was issued, in Mexico City. */
export function issueDay(invoice: Pick<Invoice, 'issuedAt'>): string {
  return formatCfdiDate(invoice.issuedAt).slice(0, 10)
}

/**
 * Where the collection of a valid invoice stands. A PPD invoice knows it from its complementos de
 * pago (`paid`); a PUE one was paid when issued unless the user marked it as awaiting payment.
 * Drafts, cancelled invoices and those being cancelled or already replaced have none (null).
 */
export function collectionState(
  invoice: CollectionInvoice,
  amounts: { total: number; paid: number },
  today: string,
): CollectionState | null {
  const stampState = invoiceStampState(invoice)
  if (stampState !== 'timbrada' && stampState !== 'cancelacion_rechazada') return null

  if (invoice.paymentMethod === 'PPD') {
    const balance = Math.max(0, round2(amounts.total - amounts.paid))
    const status: CollectionStatus =
      balance <= 0 ? 'cobrada'
        : invoice.dueDate !== null && invoice.dueDate < today ? 'vencida'
          : amounts.paid > 0 ? 'parcial'
            : 'por_cobrar'
    return { status, balance, paid: amounts.paid, dueDate: invoice.dueDate, pueExpired: false }
  }

  if (!invoice.awaitingPayment) {
    return { status: 'cobrada', balance: 0, paid: amounts.total, dueDate: invoice.dueDate, pueExpired: false }
  }

  const monthEnd = endOfMonth(issueDay(invoice))
  const dueDate = invoice.dueDate !== null && invoice.dueDate < monthEnd ? invoice.dueDate : monthEnd
  return {
    status: dueDate < today ? 'vencida' : 'por_cobrar',
    balance: amounts.total,
    paid: 0,
    dueDate,
    pueExpired: monthEnd < today,
  }
}

/** Something is still owed on it: a reminder makes sense. */
export function isOwed(state: CollectionState | null): state is CollectionState {
  return state !== null && state.status !== 'cobrada' && state.balance > 0
}
