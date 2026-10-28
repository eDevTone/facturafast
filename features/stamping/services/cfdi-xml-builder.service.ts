import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import type { IssuingProfile } from '@features/fiscal-profile/types/fiscal-profile.types'
import { computeCfdiAmounts, IVA_RATE, taxSettingsFromInvoice } from '@features/invoicing/utils/cfdi-amounts'
import {
  CFDI_NAMESPACE,
  CFDI_SCHEMA_LOCATION,
  cfdiRelacionadosXml,
  receptorXml,
  cleanCertificate,
  esc,
  formatCfdiDate,
  toNoCertificado,
  XSI_NAMESPACE,
} from '../utils/cfdi-xml'

const TAX_CODE_ISR = '001'
const TAX_CODE_IVA = '002'

function toFixed2(value: number): string {
  return value.toFixed(2)
}

function toFixed6(value: number): string {
  return value.toFixed(6)
}

/** TipoCambio: up to 6 decimals, without trailing zeros (18.425). */
function formatExchangeRate(rate: string | number): string {
  return Number(rate).toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

export interface BuildXmlParams {
  invoice: InvoiceWithRelations
  profile: IssuingProfile
  certificateBase64: string
  certificateNumber: string
}

export function buildCfdiXml(params: BuildXmlParams): string {
  const { invoice, profile, certificateBase64, certificateNumber } = params

  const noCertificado = toNoCertificado(certificateNumber)

  // Same calculation as the form preview, the stored totals and the PDF.
  const settings = taxSettingsFromInvoice(invoice)
  const amounts = computeCfdiAmounts(
    invoice.items.map((item) => ({ quantity: parseFloat(item.quantity), unitPrice: parseFloat(item.unitPrice) })),
    settings,
  )
  const isrRateStr = settings.isrWithholdingRate ? toFixed6(settings.isrWithholdingRate) : null
  const ivaRetRateStr = settings.ivaWithholdingRate ? toFixed6(settings.ivaWithholdingRate) : null
  const ivaRateStr = toFixed6(settings.ivaRate ?? IVA_RATE)

  const conceptosXml = invoice.items.map((item, index) => {
    const c = amounts.concepts[index]

    let taxes = '<cfdi:Impuestos>'
    taxes += `<cfdi:Traslados><cfdi:Traslado Base="${toFixed2(c.base)}" Impuesto="${TAX_CODE_IVA}" TipoFactor="Tasa" TasaOCuota="${ivaRateStr}" Importe="${toFixed2(c.iva)}"/></cfdi:Traslados>`
    if (isrRateStr || ivaRetRateStr) {
      taxes += '<cfdi:Retenciones>'
      if (isrRateStr) taxes += `<cfdi:Retencion Base="${toFixed2(c.base)}" Impuesto="${TAX_CODE_ISR}" TipoFactor="Tasa" TasaOCuota="${isrRateStr}" Importe="${toFixed2(c.isrWithheld)}"/>`
      if (ivaRetRateStr) taxes += `<cfdi:Retencion Base="${toFixed2(c.base)}" Impuesto="${TAX_CODE_IVA}" TipoFactor="Tasa" TasaOCuota="${ivaRetRateStr}" Importe="${toFixed2(c.ivaWithheld)}"/>`
      taxes += '</cfdi:Retenciones>'
    }
    taxes += '</cfdi:Impuestos>'

    return `<cfdi:Concepto ClaveProdServ="${esc(item.productServiceCode.trim())}" Cantidad="${toFixed6(c.quantity)}" ClaveUnidad="${esc(item.unit.trim())}" Descripcion="${esc(item.description.trim())}" ValorUnitario="${toFixed6(c.unitValue)}" Importe="${toFixed2(c.base)}" ObjetoImp="02">${taxes}</cfdi:Concepto>`
  }).join('')

  const fecha = formatCfdiDate(invoice.issuedAt)

  const cleanCert = cleanCertificate(certificateBase64)

  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += `<cfdi:Comprobante`
  xml += ` xmlns:cfdi="${CFDI_NAMESPACE}"`
  xml += ` xmlns:xsi="${XSI_NAMESPACE}"`
  xml += ` xsi:schemaLocation="${CFDI_SCHEMA_LOCATION}"`
  xml += ` Version="4.0"`
  if (invoice.serie) xml += ` Serie="${esc(invoice.serie)}"`
  xml += ` Folio="${invoice.folio}"`
  xml += ` Fecha="${fecha}"`
  xml += ` FormaPago="${esc(invoice.paymentForm)}"`
  xml += ` Sello=""`
  xml += ` NoCertificado="${esc(noCertificado)}"`
  xml += ` Certificado="${cleanCert}"`
  xml += ` SubTotal="${toFixed2(amounts.subtotal)}"`
  xml += ` Moneda="${esc(invoice.currency)}"`
  // TipoCambio is required when the currency is not MXN (CFDI40115); up to 6 decimals.
  if (invoice.currency !== 'MXN' && invoice.exchangeRate) xml += ` TipoCambio="${formatExchangeRate(invoice.exchangeRate)}"`
  xml += ` Total="${toFixed2(amounts.total)}"`
  xml += ` TipoDeComprobante="I"`
  xml += ` MetodoPago="${esc(invoice.paymentMethod)}"`
  xml += ` Exportacion="01"`
  xml += ` LugarExpedicion="${esc(profile.postalCode)}"`
  xml += `>`

  // The invoice it replaces (TipoRelacion 04), before Emisor
  if (invoice.relationType && invoice.relatedUuid) {
    xml += cfdiRelacionadosXml(invoice.relationType, [invoice.relatedUuid])
  }

  // Emisor
  xml += `<cfdi:Emisor`
  xml += ` Rfc="${esc(profile.rfc)}"`
  xml += ` Nombre="${esc(profile.businessName)}"`
  xml += ` RegimenFiscal="${esc(profile.taxRegime)}"`
  xml += `/>`

  // Receptor
  xml += receptorXml(invoice.client, { cfdiUsage: invoice.cfdiUsage, issuerPostalCode: profile.postalCode })

  // Conceptos
  xml += `<cfdi:Conceptos>${conceptosXml}</cfdi:Conceptos>`

  // Impuestos globales: Retenciones before Traslados, as the CFDI 4.0 schema orders them.
  const hasWithholdings = amounts.withholdings > 0
  xml += `<cfdi:Impuestos`
  if (hasWithholdings) xml += ` TotalImpuestosRetenidos="${toFixed2(amounts.withholdings)}"`
  xml += ` TotalImpuestosTrasladados="${toFixed2(amounts.iva)}">`
  if (hasWithholdings) {
    xml += `<cfdi:Retenciones>`
    if (amounts.isrWithheld > 0) xml += `<cfdi:Retencion Impuesto="${TAX_CODE_ISR}" Importe="${toFixed2(amounts.isrWithheld)}"/>`
    if (amounts.ivaWithheld > 0) xml += `<cfdi:Retencion Impuesto="${TAX_CODE_IVA}" Importe="${toFixed2(amounts.ivaWithheld)}"/>`
    xml += `</cfdi:Retenciones>`
  }
  xml += `<cfdi:Traslados>`
  xml += `<cfdi:Traslado Base="${toFixed2(amounts.subtotal)}" Impuesto="${TAX_CODE_IVA}" TipoFactor="Tasa" TasaOCuota="${ivaRateStr}" Importe="${toFixed2(amounts.iva)}"/>`
  xml += `</cfdi:Traslados>`
  xml += `</cfdi:Impuestos>`

  xml += `</cfdi:Comprobante>`

  return xml
}
