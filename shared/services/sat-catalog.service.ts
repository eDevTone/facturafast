import { db } from '@database/client';
import {
  cfdiUsageTypes,
  paymentForms,
  paymentMethods,
  productServiceCodes,
  taxRegimes,
  unitCodes,
} from '@database/schemas/sat-catalogs.schema';

export type CatalogOption = { value: string; label: string }

// ── Tax Regimes ─────────────────────────────────────────────────────────────

export async function getTaxRegimeOptions(): Promise<CatalogOption[]> {
  const rows = await db.select().from(taxRegimes).orderBy(taxRegimes.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
  }))
}

// ── Payment Forms ───────────────────────────────────────────────────────────

export async function getPaymentFormOptions(): Promise<CatalogOption[]> {
  const rows = await db.select().from(paymentForms).orderBy(paymentForms.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
  }))
}

// ── Payment Methods ─────────────────────────────────────────────────────────

export async function getPaymentMethodOptions(): Promise<CatalogOption[]> {
  const rows = await db.select().from(paymentMethods).orderBy(paymentMethods.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
  }))
}

// ── CFDI Usage ──────────────────────────────────────────────────────────────

export async function getCfdiUsageOptions(): Promise<CatalogOption[]> {
  const rows = await db.select().from(cfdiUsageTypes).orderBy(cfdiUsageTypes.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
  }))
}

// ── Unit Codes ──────────────────────────────────────────────────────────────

export async function getUnitCodeOptions(): Promise<CatalogOption[]> {
  const rows = await db.select().from(unitCodes).orderBy(unitCodes.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.name}`,
  }))
}

// ── Product/Service Codes ───────────────────────────────────────────────────

export async function getProductServiceCodeOptions(): Promise<CatalogOption[]> {
  const rows = await db.select().from(productServiceCodes).orderBy(productServiceCodes.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
  }))
}

// ── Bulk fetch for forms that need multiple catalogs ────────────────────────

export interface InvoiceFormCatalogs {
  paymentForms: CatalogOption[]
  paymentMethods: CatalogOption[]
  cfdiUsages: CatalogOption[]
}

export async function getInvoiceFormCatalogs(): Promise<InvoiceFormCatalogs> {
  const [pf, pm, cu] = await Promise.all([
    getPaymentFormOptions(),
    getPaymentMethodOptions(),
    getCfdiUsageOptions(),
  ])
  return { paymentForms: pf, paymentMethods: pm, cfdiUsages: cu }
}

export interface ClientFormCatalogs {
  taxRegimes: CatalogOption[]
  cfdiUsages: CatalogOption[]
}

export async function getClientFormCatalogs(): Promise<ClientFormCatalogs> {
  const [tr, cu] = await Promise.all([
    getTaxRegimeOptions(),
    getCfdiUsageOptions(),
  ])
  return { taxRegimes: tr, cfdiUsages: cu }
}

// ── Label maps (for display components) ─────────────────────────────────────

export async function getPaymentFormLabels(): Promise<Record<string, string>> {
  const rows = await db.select().from(paymentForms)
  return Object.fromEntries(rows.map((r) => [r.code, r.description]))
}

export async function getPaymentMethodLabels(): Promise<Record<string, string>> {
  const rows = await db.select().from(paymentMethods)
  return Object.fromEntries(rows.map((r) => [r.code, r.description]))
}

export async function getCfdiUsageLabels(): Promise<Record<string, string>> {
  const rows = await db.select().from(cfdiUsageTypes)
  return Object.fromEntries(rows.map((r) => [r.code, r.description]))
}

export async function getTaxRegimeLabels(): Promise<Record<string, string>> {
  const rows = await db.select().from(taxRegimes)
  return Object.fromEntries(rows.map((r) => [r.code, r.description]))
}
