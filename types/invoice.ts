export interface FiscalProfile {
  id: string
  user_id: string
  rfc: string
  razon_social: string
  regimen_fiscal: string
  codigo_postal: string
  direccion_fiscal: string
  certificado_cer?: string
  certificado_key?: string
  certificado_password?: string
  constancia_fiscal_url?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  rfc: string
  razon_social: string
  email?: string
  telefono?: string
  codigo_postal: string
  regimen_fiscal: string
  uso_cfdi: string // P01, G03, etc.
  created_at: string
}

export type InvoiceStatus = 'draft' | 'timbrada' | 'cancelada'
export type PaymentMethod = 'PUE' | 'PPD' // Pago en Una Exhibición / Pago en Parcialidades o Diferido
export type PaymentForm = '01' | '02' | '03' | '04' | '28' | '99' // Efectivo, Cheque, Transferencia, Tarjeta, etc.

export interface InvoiceItem {
  id: string
  invoice_id: string
  clave_prod_serv: string // Clave SAT (ej: 80131600 para servicios)
  descripcion: string
  cantidad: number
  unidad: string // E48, H87, etc.
  valor_unitario: number
  importe: number
  created_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  folio: number
  serie?: string
  fecha_emision: string
  subtotal: number
  iva: number
  retenciones: number
  total: number
  moneda: string // MXN default
  forma_pago: PaymentForm
  metodo_pago: PaymentMethod
  uso_cfdi: string
  xml_url?: string
  pdf_url?: string
  uuid?: string // Folio Fiscal del SAT
  estatus: InvoiceStatus
  motivo_cancelacion?: string
  fecha_cancelacion?: string
  created_at: string
  
  // Relations
  client?: Client
  items?: InvoiceItem[]
}

export interface CreateInvoiceInput {
  client_id?: string
  client_data?: {
    rfc: string
    razon_social: string
    email?: string
    codigo_postal: string
    regimen_fiscal: string
    uso_cfdi: string
  }
  items: {
    descripcion: string
    cantidad: number
    valor_unitario: number
    clave_prod_serv?: string
    unidad?: string
  }[]
  forma_pago: PaymentForm
  metodo_pago: PaymentMethod
  serie?: string
}
