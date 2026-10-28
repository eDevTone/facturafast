import { db } from '@database/client';
import {
  cfdiUsageTypes,
  countries,
  paymentForms,
  paymentMethods,
  productServiceCodes,
  taxRegimes,
  unitCodes,
} from '@database/schemas/sat-catalogs.schema';
import { eq, ne } from 'drizzle-orm';
import { personTypeOfRfc, regimeFitsRfc } from '@shared/utils/rfc';

export type CatalogOption = { value: string; label: string }
export type CfdiUsageOption = CatalogOption & { applicableToMoral: boolean; applicableToFisica: boolean }

// ── Tax Regimes ─────────────────────────────────────────────────────────────

export type TaxRegimeOption = CatalogOption & { applicableToMoral: boolean; applicableToFisica: boolean }

export async function getTaxRegimeOptions(): Promise<TaxRegimeOption[]> {
  const rows = await db.select().from(taxRegimes).orderBy(taxRegimes.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
    applicableToMoral: r.applicableToMoral,
    applicableToFisica: r.applicableToFisica,
  }))
}

/**
 * The server-side check behind the forms' régimen filter: a régimen that does not fit the RFC's
 * kind of person is refused before it is saved, instead of at the first stamp.
 */
export async function assertTaxRegimeFitsRfc(code: string, rfc: string): Promise<void> {
  const [regime] = await db.select().from(taxRegimes).where(eq(taxRegimes.code, code)).limit(1)
  if (!regime) throw new Error('Elige un régimen fiscal del catálogo del SAT.')
  if (!regimeFitsRfc(regime, rfc)) {
    const people = personTypeOfRfc(rfc) === 'moral' ? 'personas morales' : 'personas físicas'
    throw new Error(`El régimen ${code} no aplica a ${people}. Elige otro.`)
  }
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

export async function getCfdiUsageOptions(): Promise<CfdiUsageOption[]> {
  const rows = await db.select().from(cfdiUsageTypes).orderBy(cfdiUsageTypes.code)
  return rows.map((r) => ({
    value: r.code,
    label: `${r.code} - ${r.description}`,
    applicableToMoral: r.applicableToMoral,
    applicableToFisica: r.applicableToFisica,
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

// ── Countries (c_Pais) ──────────────────────────────────────────────────────

export type CountryOption = CatalogOption & {
  /** Pattern NumRegIdTrib must follow in this country, when the SAT publishes one. */
  taxIdFormat: string | null
}

/** "Estados Unidos (los)" → "Estados Unidos": the catalog keeps the article in parentheses. */
export function countryName(description: string): string {
  return description.replace(/\s*\((el|la|los|las)\)$/i, '')
}

/** Where a client abroad can reside: every country of c_Pais but México (CFDI40152). */
export async function getCountryOptions(): Promise<CountryOption[]> {
  const rows = await db.select().from(countries).where(ne(countries.code, 'MEX')).orderBy(countries.description)
  return rows.map((r) => ({ value: r.code, label: `${r.code} - ${countryName(r.description)}`, taxIdFormat: r.taxIdFormat }))
}

export async function getCountryLabels(): Promise<Record<string, string>> {
  const rows = await db.select().from(countries)
  return Object.fromEntries(rows.map((r) => [r.code, countryName(r.description)]))
}

// ── Bulk fetch for forms that need multiple catalogs ────────────────────────

export interface InvoiceFormCatalogs {
  paymentForms: CatalogOption[]
  paymentMethods: CatalogOption[]
  cfdiUsages: CfdiUsageOption[]
  productServiceCodes: CatalogOption[]
  unitCodes: CatalogOption[]
}

export async function getInvoiceFormCatalogs(): Promise<InvoiceFormCatalogs> {
  const [pf, pm, cu, ps, uc] = await Promise.all([
    getPaymentFormOptions(),
    getPaymentMethodOptions(),
    getCfdiUsageOptions(),
    getProductServiceCodeOptions(),
    getUnitCodeOptions(),
  ])
  return { paymentForms: pf, paymentMethods: pm, cfdiUsages: cu, productServiceCodes: ps, unitCodes: uc }
}

export interface ClientFormCatalogs {
  taxRegimes: TaxRegimeOption[]
  cfdiUsages: CatalogOption[]
  countries: CountryOption[]
}

export async function getClientFormCatalogs(): Promise<ClientFormCatalogs> {
  const [tr, cu, co] = await Promise.all([
    getTaxRegimeOptions(),
    getCfdiUsageOptions(),
    getCountryOptions(),
  ])
  return { taxRegimes: tr, cfdiUsages: cu, countries: co }
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
