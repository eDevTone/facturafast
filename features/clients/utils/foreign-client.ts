/** RFC genérico de un residente en el extranjero (RMF 2026, regla 2.7.1.23). */
export const FOREIGN_RFC = 'XEXX010101000'
/** "Sin obligaciones fiscales": the régimen of a receptor abroad (CFDI40159). */
export const FOREIGN_TAX_REGIME = '616'
/** "Sin efectos fiscales": the uso CFDI of an income invoice to a receptor abroad (guía de llenado, p. 20). */
export const FOREIGN_CFDI_USAGE = 'S01'
/** RFCs that many clients share: público en general and residentes en el extranjero. */
export const GENERIC_RFCS = ['XAXX010101000', FOREIGN_RFC]

/** IVA a client is charged: 0 % for exported services (LIVA art. 29) or 16 %. */
export const IVA_RATE_CHOICES = ['0', '0.16'] as const
export type IvaRateChoice = (typeof IVA_RATE_CHOICES)[number]

export function isForeignClient(client: { rfc: string }): boolean {
  return client.rfc === FOREIGN_RFC
}

/** NumRegIdTrib as the SAT reads it: without spaces or hyphens, in upper case (a US EIN is 9 digits). */
export function normalizeForeignTaxId(value: string): string {
  return value.replace(/[\s-]/g, '').toUpperCase()
}

/** True when the tax id follows the pattern c_Pais publishes for the country, or the country has none (CFDI40156). */
export function foreignTaxIdMatches(value: string, format: string | null | undefined): boolean {
  return !format || new RegExp(`^(?:${format})$`).test(value)
}

/** The stored rate ("0.000000", "0.160000") as the form's choice; undefined when none was chosen. */
export function ivaRateChoice(value: string | null | undefined): IvaRateChoice | undefined {
  if (value === null || value === undefined || value === '') return undefined
  return Number(value) === 0 ? '0' : '0.16'
}
