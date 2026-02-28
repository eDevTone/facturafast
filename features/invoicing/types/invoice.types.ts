// Invoice Types
export interface Invoice {
  id: string
  userId: string
  clientId: string
  folio: number
  serie: string | null
  fechaEmision: Date
  subtotal: string
  iva: string
  retenciones: string
  total: string
  moneda: string
  formaPago: string
  metodoPago: string
  usoCfdi: string
  xmlUrl: string | null
  pdfUrl: string | null
  uuid: string | null
  estatus: 'draft' | 'timbrada' | 'cancelada'
  motivoCancelacion: string | null
  fechaCancelacion: Date | null
  createdAt: Date
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  claveProdServ: string
  descripcion: string
  cantidad: string
  unidad: string
  valorUnitario: string
  importe: string
  createdAt: Date
}

// Input Types
export interface CreateInvoiceInput {
  clientId: string
  serie?: string
  formaPago: string
  metodoPago: string
  usoCfdi: string
  moneda?: string
  items: CreateInvoiceItemInput[]
}

export interface CreateInvoiceItemInput {
  claveProdServ?: string
  descripcion: string
  cantidad: number
  unidad?: string
  valorUnitario: number
}

// Response Types
export interface InvoiceWithRelations extends Invoice {
  client: {
    id: string
    razonSocial: string
    rfc: string
  }
  items: InvoiceItem[]
}
