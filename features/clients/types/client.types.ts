export interface Client {
  id: string
  userId: string
  rfc: string
  businessName: string
  email: string | null
  phone: string | null
  postalCode: string
  taxRegime: string | null
  cfdiUsage: string
  createdAt: Date
}

export interface CreateClientInput {
  rfc: string
  businessName: string
  email?: string
  phone?: string
  postalCode: string
  taxRegime?: string
  cfdiUsage?: string
}
