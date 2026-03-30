import type { InvoiceWithRelations } from '@features/invoicing/types/invoice.types'
import type { IssuingProfile } from '@features/fiscal-profile/types/fiscal-profile.types'

const CFDI_NAMESPACE = 'http://www.sat.gob.mx/cfd/4'
const XSI_NAMESPACE = 'http://www.w3.org/2001/XMLSchema-instance'
const SCHEMA_LOCATION = 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd'

const IVA_RATE = 0.16
const IVA_DIVISOR = 1 + IVA_RATE // 1.16
const IVA_RATE_STR = '0.160000'
const TAX_CODE_IVA = '002'

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function toFixed2(value: number): string {
  return value.toFixed(2)
}

function toFixed6(value: number): string {
  return value.toFixed(6)
}

function formatCfdiDate(date: Date): string {
  const d = new Date(date)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export interface BuildXmlParams {
  invoice: InvoiceWithRelations
  profile: IssuingProfile
  certificateBase64: string
  certificateNumber: string
}

export function buildCfdiXml(params: BuildXmlParams): string {
  const { invoice, profile, certificateBase64, certificateNumber } = params

  // Ensure NoCertificado is ASCII digits (20 chars), not hex
  // If it looks like hex (>20 chars, all hex digits), convert to ASCII
  let noCertificado = certificateNumber
  if (/^[0-9a-fA-F]+$/.test(noCertificado) && noCertificado.length > 20) {
    noCertificado = Buffer.from(noCertificado, 'hex').toString('ascii')
  }

  // Prices in DB include IVA. CFDI requires amounts WITHOUT IVA.
  let cfdiSubtotal = 0
  let totalTaxAmount = 0

  const conceptosXml = invoice.items.map((item) => {
    const amountWithIva = parseFloat(item.amount)
    const baseAmount = amountWithIva / IVA_DIVISOR    // Amount without IVA
    const taxAmount = amountWithIva - baseAmount       // IVA portion
    const unitPriceWithIva = parseFloat(item.unitPrice)
    const unitPriceBase = unitPriceWithIva / IVA_DIVISOR

    cfdiSubtotal += baseAmount
    totalTaxAmount += taxAmount

    return `<cfdi:Concepto ClaveProdServ="${esc(item.productServiceCode)}" Cantidad="${toFixed6(parseFloat(item.quantity))}" ClaveUnidad="${esc(item.unit)}" Descripcion="${esc(item.description)}" ValorUnitario="${toFixed2(unitPriceBase)}" Importe="${toFixed2(baseAmount)}" ObjetoImp="02"><cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="${toFixed2(baseAmount)}" Importe="${toFixed2(taxAmount)}" Impuesto="${TAX_CODE_IVA}" TasaOCuota="${IVA_RATE_STR}" TipoFactor="Tasa"/></cfdi:Traslados></cfdi:Impuestos></cfdi:Concepto>`
  }).join('')

  const total = cfdiSubtotal + totalTaxAmount
  const fecha = formatCfdiDate(invoice.issuedAt)

  // Clean certificate base64 (remove line breaks/spaces)
  const cleanCert = certificateBase64.replace(/[\s\r\n]/g, '')

  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += `<cfdi:Comprobante`
  xml += ` xmlns:cfdi="${CFDI_NAMESPACE}"`
  xml += ` xmlns:xsi="${XSI_NAMESPACE}"`
  xml += ` xsi:schemaLocation="${SCHEMA_LOCATION}"`
  xml += ` Version="4.0"`
  if (invoice.serie) xml += ` Serie="${esc(invoice.serie)}"`
  xml += ` Folio="${invoice.folio}"`
  xml += ` Fecha="${fecha}"`
  xml += ` FormaPago="${esc(invoice.paymentForm)}"`
  xml += ` Sello=""`
  xml += ` NoCertificado="${esc(noCertificado)}"`
  xml += ` Certificado="${cleanCert}"`
  xml += ` SubTotal="${toFixed2(cfdiSubtotal)}"`
  xml += ` Moneda="${esc(invoice.currency)}"`
  xml += ` Total="${toFixed2(total)}"`
  xml += ` TipoDeComprobante="I"`
  xml += ` MetodoPago="${esc(invoice.paymentMethod)}"`
  xml += ` Exportacion="01"`
  xml += ` LugarExpedicion="${esc(profile.postalCode)}"`
  xml += `>`

  // Emisor
  xml += `<cfdi:Emisor`
  xml += ` Rfc="${esc(profile.rfc)}"`
  xml += ` Nombre="${esc(profile.businessName)}"`
  xml += ` RegimenFiscal="${esc(profile.taxRegime)}"`
  xml += `/>`

  // Receptor
  xml += `<cfdi:Receptor`
  xml += ` Rfc="${esc(invoice.client.rfc)}"`
  xml += ` Nombre="${esc(invoice.client.businessName)}"`
  xml += ` DomicilioFiscalReceptor="${esc(invoice.client.postalCode)}"`
  xml += ` RegimenFiscalReceptor="${esc(invoice.client.taxRegime || '616')}"`
  xml += ` UsoCFDI="${esc(invoice.cfdiUsage)}"`
  xml += `/>`

  // Conceptos
  xml += `<cfdi:Conceptos>${conceptosXml}</cfdi:Conceptos>`

  // Impuestos globales
  xml += `<cfdi:Impuestos TotalImpuestosTrasladados="${toFixed2(totalTaxAmount)}">`
  xml += `<cfdi:Traslados>`
  xml += `<cfdi:Traslado Base="${toFixed2(cfdiSubtotal)}" Importe="${toFixed2(totalTaxAmount)}" Impuesto="${TAX_CODE_IVA}" TasaOCuota="${IVA_RATE_STR}" TipoFactor="Tasa"/>`
  xml += `</cfdi:Traslados>`
  xml += `</cfdi:Impuestos>`

  xml += `</cfdi:Comprobante>`

  return xml
}
