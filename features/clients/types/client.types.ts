import type { ClientFormData } from '../schemas/client-form.schema'

export interface Client {
  id: string
  userId: string
  rfc: string
  businessName: string
  email: string | null
  phone: string | null
  /** Mexican fiscal postal code; null for a client abroad. */
  postalCode: string | null
  taxRegime: string | null
  cfdiUsage: string
  /** c_Pais of a client abroad (RFC XEXX010101000); null for a Mexican client. */
  country: string | null
  /** NumRegIdTrib: the client's tax id in its country. */
  foreignTaxId: string | null
  /** IVA this client is charged ('0' or '0.16'); null for a Mexican client (16 %). */
  ivaRate: string | null
  /** "Días de crédito": days the client takes to pay; null: no term. */
  paymentTermsDays: number | null
  createdAt: Date
}

/** A client as the form sends it, validated by `createClientFormSchema`. */
export type CreateClientInput = ClientFormData
