export interface Client {
  id: string
  userId: string
  rfc: string
  razonSocial: string
  email: string | null
  telefono: string | null
  codigoPostal: string
  regimenFiscal: string | null
  usoCfdi: string
  createdAt: Date
}

export interface CreateClientInput {
  rfc: string
  razonSocial: string
  email?: string
  telefono?: string
  codigoPostal: string
  regimenFiscal?: string
  usoCfdi?: string
}
