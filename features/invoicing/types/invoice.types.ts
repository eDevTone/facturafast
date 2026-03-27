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
  total: string
  currency: string
  paymentForm: string
  paymentMethod: string
  cfdiUsage: string
  xmlUrl: string | null
  pdfUrl: string | null
  uuid: string | null
  status: 'draft' | 'timbrada' | 'cancelada'
  cancellationReason: string | null
  cancelledAt: Date | null
  createdAt: Date
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
  items: CreateInvoiceItemInput[]
}

export interface CreateInvoiceItemInput {
  productServiceCode?: string
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
  }
  items: InvoiceItem[]
}
