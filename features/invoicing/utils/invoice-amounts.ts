import type { InvoiceWithRelations } from '../types/invoice.types'
import { computeCfdiAmounts, round2, taxSettingsFromInvoice, type CfdiAmounts } from './cfdi-amounts'

function readAttribute(xml: string, element: string, attribute: string): number | null {
  const tag = xml.match(new RegExp(`<cfdi:${element}\\b[^>]*>`))
  if (!tag) return null
  const value = tag[0].match(new RegExp(`\\s${attribute}="([^"]+)"`))
  return value ? Number(value[1]) : null
}

/** Totals declared in a stamped CFDI, or null when the XML does not have them. */
export function readXmlTotals(xml: string) {
  const subtotal = readAttribute(xml, 'Comprobante', 'SubTotal')
  const total = readAttribute(xml, 'Comprobante', 'Total')
  // The global <cfdi:Impuestos> is the last one in the document; concept taxes come first.
  const globalTaxes = xml.slice(xml.lastIndexOf('<cfdi:Impuestos'))
  const iva = readAttribute(globalTaxes, 'Impuestos', 'TotalImpuestosTrasladados')
  const withholdings = readAttribute(globalTaxes, 'Impuestos', 'TotalImpuestosRetenidos') ?? 0
  if (subtotal === null || total === null || iva === null) return null
  return { subtotal, iva, withholdings, total }
}

/**
 * Amounts to show for an invoice (detail page and PDF).
 * Computed with the same function as the XML; once stamped, the totals are read back
 * from the stamped XML so the printed document always matches what the SAT has.
 */
export function invoiceAmounts(invoice: InvoiceWithRelations): CfdiAmounts {
  const amounts = computeCfdiAmounts(
    invoice.items.map((item) => ({ quantity: parseFloat(item.quantity), unitPrice: parseFloat(item.unitPrice) })),
    taxSettingsFromInvoice(invoice),
  )

  const stamped = invoice.xmlContent ? readXmlTotals(invoice.xmlContent) : null
  if (!stamped) return amounts

  return {
    ...amounts,
    ...stamped,
    // Keep the ISR/IVA split computed; if the XML total differs, trust the XML.
    isrWithheld: stamped.withholdings > 0 ? amounts.isrWithheld : 0,
    ivaWithheld: stamped.withholdings > 0 ? round2(stamped.withholdings - amounts.isrWithheld) : 0,
  }
}
