// Invoice Types
export interface Invoice {
  id: string
  userId: string
  clientId: string
  issuingProfileId: string | null
  folio: number
  serie: string | null
  issuedAt: Date
  subtotal: string
  iva: string
  withholdings: string
  pricesIncludeIva: boolean
  isrWithholdingRate: string | null
  ivaWithholdingRate: string | null
  total: string
  currency: string
  /** TipoCambio: pesos per unit of `currency`; null in pesos. */
  exchangeRate: string | null
  /** 'dof': Banxico's rate for the stamping day; 'manual': typed by the user. */
  exchangeRateSource: string | null
  /** IVA rate: '0.160000', or '0.000000' for exported services. */
  ivaRate: string
  paymentForm: string
  paymentMethod: string
  cfdiUsage: string
  xmlUrl: string | null
  xmlContent: string | null
  pdfUrl: string | null
  uuid: string | null
  satCertificateNumber: string | null
  cfdiSignature: string | null
  satSignature: string | null
  satOriginalChain: string | null
  qrCode: string | null
  stampedAt: Date | null
  stampingStartedAt: Date | null
  status: 'draft' | 'timbrada' | 'cancelada'
  cancellationReason: string | null
  cancellationAcuseUrl: string | null
  cancelledAt: Date | null
  /** c_TipoRelacion: '04' when this invoice replaces another one. */
  relationType: string | null
  /** UUID of the invoice this one replaces. */
  relatedUuid: string | null
  /** Pending cancellation request; the invoice stays `timbrada` until the SAT cancels it. */
  cancellationStatus: CancellationStatus | null
  cancellationRequestedAt: Date | null
  /** UUID of the invoice that replaces this one (FolioSustitucion). */
  cancellationSubstituteUuid: string | null
  /** EsCancelable, from the last SAT status query. */
  satCancellable: string | null
  /** EstatusCancelacion, from the last SAT status query. */
  satCancellationStatus: string | null
  satCheckedAt: Date | null
  /** "Días de crédito" of this invoice, taken from the client; null: no due date. */
  paymentTermsDays: number | null
  /** YYYY-MM-DD the payment is due (stamping day plus the days of credit), set when stamped. */
  dueDate: string | null
  /** Only PUE: the user marked it as not paid yet. */
  awaitingPayment: boolean
  /** The recurring invoice ("Repetir cada mes") that made it. */
  recurringInvoiceId: string | null
  /** Month it was made for, YYYY-MM. */
  recurringPeriod: string | null
  createdAt: Date
}

export type CancellationStatus = 'en_proceso' | 'rechazada'

/** What the cancel and correct dialogs show before asking: whether the client will have to accept and until when. */
export interface CancellationPreview {
  /** EsCancelable; null when the SAT could not be asked or does not know the CFDI. */
  cancellable: string | null
  /** Last day to cancel it (CFF 29-A), YYYY-MM-DD. */
  deadline: string
  expired: boolean
  /** The SAT reports it cancelled (for example, from its portal); the invoice was updated. */
  cancelled: boolean
  /** Why the SAT could not be asked. */
  error?: string
}

/** Another invoice linked by a correction: the one this replaces, or the one that replaces it. */
export interface RelatedInvoice {
  /** null when the CFDI is not in the app (a UUID typed by hand). */
  id: string | null
  /** "A-3"; null when the CFDI is not in the app. */
  label: string | null
  uuid: string
  status: Invoice['status'] | null
  cancellationStatus: CancellationStatus | null
  /** Receptor RFC of its CFDI, to tell whether a correction changed the client. */
  receiverRfc: string | null
}

export interface InvoiceRelations {
  replaces?: RelatedInvoice
  replacedBy?: RelatedInvoice
  /** A draft that corrects this invoice and has not been stamped yet. */
  correctionDraft?: { id: string; label: string }
}

/** What happened to the invoice a correction replaces, right after the correction was stamped. */
export interface ReplacementOutcome {
  invoiceId: string
  /** "A-3" */
  label: string
  /** `por_cancelar`: the cancellation request failed and can be retried from the original. */
  outcome: 'cancelada' | 'en_proceso' | 'por_cancelar' | 'ya_cancelada'
  error?: string
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  productServiceCode: string
  description: string
  quantity: string
  unit: string
  unitPrice: string
  amount: string
  createdAt: Date
}

// Input Types
export interface CreateInvoiceInput {
  clientId: string
  issuingProfileId?: string
  serie?: string
  paymentForm: string
  paymentMethod: string
  cfdiUsage: string
  currency?: string
  exchangeRate?: number | null
  exchangeRateSource?: 'dof' | 'manual' | null
  ivaRate?: number
  /** "Días de crédito"; null: no due date. */
  paymentTermsDays?: number | null
  pricesIncludeIva: boolean
  isrWithholdingRate: number | null
  ivaWithholdingRate: number | null
  items: CreateInvoiceItemInput[]
}

export interface CreateInvoiceItemInput {
  /** ClaveProdServ (8 digits), chosen by the user for every concept. */
  productServiceCode: string
  description: string
  quantity: number
  unit?: string
  unitPrice: number
}

// Response Types
export interface InvoiceWithRelations extends Invoice {
  client: {
    id: string
    businessName: string
    rfc: string
    /** null for a client abroad: its CFDI takes the issuer's CP. */
    postalCode: string | null
    taxRegime: string | null
    email: string | null
    /** For the WhatsApp reminder. */
    phone: string | null
    /** c_Pais of a client abroad. */
    country: string | null
    /** NumRegIdTrib of a client abroad. */
    foreignTaxId: string | null
  }
  items: InvoiceItem[]
}
