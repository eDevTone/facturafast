import { IVA_RATE, round2 } from '@features/invoicing/utils/cfdi-amounts'

/** The price a saved service puts in an invoice line: with IVA when the invoice prices include it. */
export function priceForInvoice(unitPrice: string | null, pricesIncludeIva: boolean, ivaRate = IVA_RATE): number | null {
  if (unitPrice === null) return null
  const beforeIva = Number(unitPrice)
  return pricesIncludeIva ? round2(beforeIva * (1 + ivaRate)) : beforeIva
}

/** The price saved from an invoice line: always before IVA, as the catalog keeps it. */
export function priceForCatalog(unitPrice: number, pricesIncludeIva: boolean, ivaRate = IVA_RATE): number {
  return pricesIncludeIva ? round2(unitPrice / (1 + ivaRate)) : round2(unitPrice)
}
