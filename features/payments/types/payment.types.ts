import type { Payment } from '@database/schemas/payments.schema'

export type PaymentStatus = Payment['status']

/** A payment applied to an invoice, as the invoice detail lists it. */
export interface InvoicePayment {
  id: string
  serie: string
  folio: number
  /** YYYY-MM-DD */
  paidOn: string
  paymentForm: string
  amount: string
  operationNumber: string | null
  status: PaymentStatus
  uuid: string | null
  stampingStartedAt: Date | null
  stampedAt: Date | null
  xmlUrl: string | null
  pdfUrl: string | null
  /** NumParcialidad */
  installment: number
  /** ImpSaldoAnt */
  previousBalance: string
  /** ImpPagado */
  amountPaid: string
  /** ImpSaldoInsoluto */
  remainingBalance: string
  /** Still `en_timbrado` after the stamping window: the PAC answer was lost; it can be retried. */
  unconfirmed: boolean
  /** MonedaP: the currency of the invoice. */
  currency: string
  /** TipoCambioP; null in pesos. */
  exchangeRate: string | null
  /** UUID of the complemento this one replaces (a correction). */
  relatedUuid: string | null
  /** Pending cancellation request; the payment stays `timbrado` until the SAT cancels it. */
  cancellationStatus: 'en_proceso' | 'rechazada' | null
  cancellationReason: string | null
  cancellationRequestedAt: Date | null
  /** UUID of the complemento that replaces this one (FolioSustitucion). */
  cancellationSubstituteUuid: string | null
  satCancellable: string | null
  satCancellationStatus: string | null
  satCheckedAt: Date | null
}

/** What happened to the complemento a correction replaces, right after the correction was stamped. */
export interface PaymentReplacementOutcome {
  paymentId: string
  /** "P-2" */
  label: string
  outcome: 'cancelado' | 'en_proceso' | 'por_cancelar'
  error?: string
}

/** Where a PPD invoice stands: what was collected and what is still owed. */
export interface InvoiceBalance {
  total: number
  paid: number
  balance: number
  /** NumParcialidad of the next payment. */
  nextInstallment: number
}

export interface RegisterPaymentInput {
  invoiceId: string
  /** YYYY-MM-DD */
  paidOn: string
  /** c_FormaPago, never 99. */
  paymentForm: string
  amount: number
  operationNumber?: string | null
  /** TipoCambioP of a payment in dollars. */
  exchangeRate?: number | null
}

export type PaymentErrorCode =
  | 'NO_STAMPS'
  | 'IN_PROGRESS'
  /** Another payment of the invoice was never confirmed; it must be retried first. */
  | 'UNCONFIRMED_PENDING'
  | 'PAC_REJECTED'
  /** The PAC did not answer; the payment is kept and can be retried. */
  | 'UNCONFIRMED'
  /** A payment of the invoice is being cancelled: its balance is not known until the SAT answers. */
  | 'CANCELLATION_PENDING'

export type PaymentResult =
  | { success: true; paymentId: string; uuid: string; replacement?: PaymentReplacementOutcome }
  | { success: false; code?: PaymentErrorCode; error: string }
