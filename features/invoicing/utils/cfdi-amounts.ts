/**
 * The one place where invoice amounts are computed.
 *
 * The form preview, the stored totals, the CFDI XML and the PDF all call
 * `computeCfdiAmounts`, so what the user sees is exactly what gets stamped.
 * Rounding follows the SAT rules for CFDI 4.0: each concept's Importe and each
 * tax Importe is rounded to 2 decimals, and the global amounts are sums of the
 * already rounded concept amounts.
 */

export const IVA_RATE = 0.16
/** Two thirds of IVA, as the SAT publishes it for TasaOCuota. */
export const IVA_WITHHOLDING_RATE = 0.106667
/** ISR withheld by a persona moral from a RESICO (626) persona física. */
export const ISR_RESICO_RATE = 0.0125
/** ISR withheld on honorarios from régimen 612. */
export const ISR_HONORARIOS_RATE = 0.1

export interface AmountItemInput {
  quantity: number
  /** Unit price as the user typed it (with or without IVA, see `pricesIncludeIva`). */
  unitPrice: number
}

export interface TaxSettings {
  pricesIncludeIva: boolean
  /** IVA rate of the invoice: 0.16, or 0 for exported services. Defaults to 0.16. */
  ivaRate?: number
  /** e.g. 0.0125; null or 0 means no ISR withholding. */
  isrWithholdingRate: number | null
  /** e.g. 0.106667; null or 0 means no IVA withholding. */
  ivaWithholdingRate: number | null
}

export interface ConceptAmounts {
  quantity: number
  /** ValorUnitario: unit value before taxes, up to 6 decimals. */
  unitValue: number
  /** Importe and Base of every tax: quantity × unitValue, 2 decimals. */
  base: number
  iva: number
  isrWithheld: number
  ivaWithheld: number
}

export interface CfdiAmounts {
  concepts: ConceptAmounts[]
  subtotal: number
  iva: number
  isrWithheld: number
  ivaWithheld: number
  /** isrWithheld + ivaWithheld */
  withholdings: number
  /** Total of the CFDI: subtotal + iva − withholdings ("neto a recibir"). */
  total: number
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function round6(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000
}

/** Sums money values without accumulating float noise. */
function sum2(values: number[]): number {
  return round2(values.reduce((acc, value) => acc + value, 0))
}

export function computeCfdiAmounts(items: AmountItemInput[], settings: TaxSettings): CfdiAmounts {
  const isrRate = settings.isrWithholdingRate ?? 0
  const ivaRetRate = settings.ivaWithholdingRate ?? 0
  const ivaRate = settings.ivaRate ?? IVA_RATE

  const concepts = items.map((item): ConceptAmounts => {
    const quantity = Number(item.quantity) || 0
    const price = Number(item.unitPrice) || 0
    const unitValue = settings.pricesIncludeIva ? round6(price / (1 + ivaRate)) : round6(price)
    const base = round2(quantity * unitValue)

    return {
      quantity,
      unitValue,
      base,
      iva: round2(base * ivaRate),
      isrWithheld: isrRate > 0 ? round2(base * isrRate) : 0,
      ivaWithheld: ivaRetRate > 0 ? round2(base * ivaRetRate) : 0,
    }
  })

  const subtotal = sum2(concepts.map((c) => c.base))
  const iva = sum2(concepts.map((c) => c.iva))
  const isrWithheld = sum2(concepts.map((c) => c.isrWithheld))
  const ivaWithheld = sum2(concepts.map((c) => c.ivaWithheld))
  const withholdings = round2(isrWithheld + ivaWithheld)

  return {
    concepts,
    subtotal,
    iva,
    isrWithheld,
    ivaWithheld,
    withholdings,
    total: round2(subtotal + iva - withholdings),
  }
}

/** Reads the tax settings stored on an invoice row (numeric columns come back as strings). */
export function taxSettingsFromInvoice(invoice: {
  pricesIncludeIva: boolean
  isrWithholdingRate: string | null
  ivaWithholdingRate: string | null
  ivaRate?: string | null
}): TaxSettings {
  return {
    pricesIncludeIva: invoice.pricesIncludeIva,
    ivaRate: invoice.ivaRate === undefined || invoice.ivaRate === null ? IVA_RATE : Number(invoice.ivaRate),
    isrWithholdingRate: invoice.isrWithholdingRate ? Number(invoice.isrWithholdingRate) : null,
    ivaWithholdingRate: invoice.ivaWithholdingRate ? Number(invoice.ivaWithholdingRate) : null,
  }
}

/**
 * Withholdings a persona moral must apply when paying a persona física for services.
 * Returns no withholdings when the receptor is a persona física (13-char RFC), when the
 * issuer is a persona moral (a RESICO persona moral is not withheld 1.25 %, art. 113-J LISR)
 * or when the issuer's régimen does not call for them. The user can always turn them off.
 */
export function suggestWithholdings(
  issuer: { rfc?: string | null; taxRegime?: string | null } | null | undefined,
  receptorRfc: string | null | undefined,
): Pick<TaxSettings, 'isrWithholdingRate' | 'ivaWithholdingRate'> {
  const receptorIsMoral = (receptorRfc ?? '').trim().length === 12
  const issuerIsFisica = (issuer?.rfc ?? '').trim().length === 13
  if (!receptorIsMoral || !issuerIsFisica) return { isrWithholdingRate: null, ivaWithholdingRate: null }

  switch (issuer?.taxRegime) {
    case '626':
      return { isrWithholdingRate: ISR_RESICO_RATE, ivaWithholdingRate: IVA_WITHHOLDING_RATE }
    case '612':
      return { isrWithholdingRate: ISR_HONORARIOS_RATE, ivaWithholdingRate: IVA_WITHHOLDING_RATE }
    default:
      return { isrWithholdingRate: null, ivaWithholdingRate: null }
  }
}
