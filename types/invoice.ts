export interface FiscalProfile {
  id: string
  user_id: string
  rfc: string
  business_name: string
  tax_regime: string
  postal_code: string
  fiscal_address: string
  certificate_cer?: string
  certificate_key?: string
  certificate_password?: string
  tax_certificate_url?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  rfc: string
  business_name: string
  email?: string
  phone?: string
  postal_code: string
  tax_regime: string
  cfdi_usage: string // P01, G03, etc.
  created_at: string
}

export type InvoiceStatus = 'draft' | 'timbrada' | 'cancelada'
export type PaymentMethod = 'PUE' | 'PPD' // Pago en Una Exhibición / Pago en Parcialidades o Diferido
export type PaymentForm = '01' | '02' | '03' | '04' | '28' | '99' // Efectivo, Cheque, Transferencia, Tarjeta, etc.

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_service_code: string // Clave SAT (ej: 80131600 para servicios)
  description: string
  quantity: number
  unit: string // E48, H87, etc.
  unit_price: number
  amount: number
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  folio: number
  serie?: string
  issued_at: string
  subtotal: number
  iva: number
  withholdings: number
  total: number
  currency: string // MXN default
  payment_form: PaymentForm
  payment_method: PaymentMethod
  cfdi_usage: string
  xml_url?: string
  pdf_url?: string
  uuid?: string // Folio Fiscal del SAT
  status: InvoiceStatus
  cancellation_reason?: string
  cancelled_at?: string
  created_at: string

  // Relations
  client?: Client
  items?: InvoiceItem[]
}

export interface CreateInvoiceInput {
  client_id?: string
  client_data?: {
    rfc: string
    business_name: string
    email?: string
    postal_code: string
    tax_regime: string
    cfdi_usage: string
  }
  items: {
    description: string
    quantity: number
    unit_price: number
    product_service_code?: string
    unit?: string
  }[]
  payment_form: PaymentForm
  payment_method: PaymentMethod
  serie?: string
}
