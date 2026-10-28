import {
  computePaymentTaxes,
  computePaymentTotals,
  type PaymentDocumentAmounts,
  type PaymentTotals,
} from '@features/payments/utils/payment-amounts'
import {
  CFDI_NAMESPACE,
  CFDI_SCHEMA_LOCATION,
  cfdiRelacionadosXml,
  receptorXml,
  type ReceptorData,
  cleanCertificate,
  esc,
  formatCfdiDate,
  RELATION_SUBSTITUTION,
  toNoCertificado,
  XSI_NAMESPACE,
} from '../utils/cfdi-xml'

const PAGOS_NAMESPACE = 'http://www.sat.gob.mx/Pagos20'
const PAGOS_SCHEMA_LOCATION = 'http://www.sat.gob.mx/Pagos20 http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd'

/** Attribute order of pago20:Totales, as Pagos20.xslt reads them. */
const TOTALS_ATTRIBUTES: [keyof PaymentTotals, string][] = [
  ['totalRetencionesIVA', 'TotalRetencionesIVA'],
  ['totalRetencionesISR', 'TotalRetencionesISR'],
  ['totalRetencionesIEPS', 'TotalRetencionesIEPS'],
  ['totalTrasladosBaseIVA16', 'TotalTrasladosBaseIVA16'],
  ['totalTrasladosImpuestoIVA16', 'TotalTrasladosImpuestoIVA16'],
  ['totalTrasladosBaseIVA8', 'TotalTrasladosBaseIVA8'],
  ['totalTrasladosImpuestoIVA8', 'TotalTrasladosImpuestoIVA8'],
  ['totalTrasladosBaseIVA0', 'TotalTrasladosBaseIVA0'],
  ['totalTrasladosImpuestoIVA0', 'TotalTrasladosImpuestoIVA0'],
  ['totalTrasladosBaseIVAExento', 'TotalTrasladosBaseIVAExento'],
  ['montoTotalPagos', 'MontoTotalPagos'],
]

function toFixed2(value: number): string {
  return value.toFixed(2)
}

/**
 * FechaPago: the chosen day at 12:00:00, the time the SAT guide asks for when the real one is
 * unknown. A payment made today before noon takes the CFDI time instead, so FechaPago is never
 * later than the Fecha of the complemento.
 */
export function formatPaymentDate(paidOn: string, cfdiDate: string): string {
  const [cfdiDay, cfdiTime] = cfdiDate.split('T')
  if (paidOn > cfdiDay) throw new Error('La fecha de pago no puede ser posterior a hoy.')
  if (paidOn === cfdiDay && cfdiTime < '12:00:00') return cfdiDate
  return `${paidOn}T12:00:00`
}

export interface PaymentXmlDocument {
  /** UUID of the invoice (IdDocumento). */
  uuid: string
  serie: string | null
  folio: number
  /** MonedaDR */
  currency: string
  amounts: PaymentDocumentAmounts
}

export interface BuildPaymentXmlParams {
  payment: {
    serie: string
    folio: number
    /** Fecha of the complemento: when it is stamped. */
    issuedAt: Date
    /** YYYY-MM-DD */
    paidOn: string
    /** FormaDePagoP */
    paymentForm: string
    /** Monto */
    amount: number
    /** NumOperacion */
    operationNumber: string | null
    /** MonedaP: the currency of the invoice (MXN or USD). */
    currency?: string
    /** TipoCambioP: pesos per unit of `currency` on the payment day; ignored in MXN. */
    exchangeRate?: number | null
    /** UUID of the complemento this one replaces; a complemento only relates with TipoRelacion 04. */
    relatedUuid?: string | null
  }
  documents: PaymentXmlDocument[]
  profile: { rfc: string; businessName: string; taxRegime: string; postalCode: string }
  client: ReceptorData
  certificateBase64: string
  certificateNumber: string
}

function documentXml(document: PaymentXmlDocument): string {
  const { amounts } = document
  let xml = '<pago20:DoctoRelacionado'
  xml += ` IdDocumento="${esc(document.uuid)}"`
  if (document.serie) xml += ` Serie="${esc(document.serie)}"`
  xml += ` Folio="${document.folio}"`
  xml += ` MonedaDR="${esc(document.currency)}"`
  // Same currency as the payment (CRP20238).
  xml += ` EquivalenciaDR="1"`
  xml += ` NumParcialidad="${amounts.installment}"`
  xml += ` ImpSaldoAnt="${toFixed2(amounts.previousBalance)}"`
  xml += ` ImpPagado="${toFixed2(amounts.amountPaid)}"`
  xml += ` ImpSaldoInsoluto="${toFixed2(amounts.remainingBalance)}"`
  xml += ` ObjetoImpDR="${amounts.taxObject}"`

  if (amounts.taxes.length === 0) return `${xml}/>`

  const retentions = amounts.taxes.filter((t) => t.kind === 'retencion')
  const transfers = amounts.taxes.filter((t) => t.kind === 'traslado')
  xml += '><pago20:ImpuestosDR>'
  if (retentions.length > 0) {
    xml += '<pago20:RetencionesDR>'
    for (const t of retentions) {
      xml += `<pago20:RetencionDR BaseDR="${toFixed2(t.base)}" ImpuestoDR="${t.tax}" TipoFactorDR="${t.factorType}" TasaOCuotaDR="${t.rate}" ImporteDR="${toFixed2(t.amount ?? 0)}"/>`
    }
    xml += '</pago20:RetencionesDR>'
  }
  if (transfers.length > 0) {
    xml += '<pago20:TrasladosDR>'
    for (const t of transfers) {
      xml += `<pago20:TrasladoDR BaseDR="${toFixed2(t.base)}" ImpuestoDR="${t.tax}" TipoFactorDR="${t.factorType}"`
      if (t.factorType !== 'Exento') xml += ` TasaOCuotaDR="${t.rate}" ImporteDR="${toFixed2(t.amount ?? 0)}"`
      xml += '/>'
    }
    xml += '</pago20:TrasladosDR>'
  }
  xml += '</pago20:ImpuestosDR></pago20:DoctoRelacionado>'
  return xml
}

/**
 * Builds the unsigned XML of a complemento de pago (CFDI 4.0 tipo P with Pagos 2.0) for one
 * payment in MXN. The amounts come from `payment-amounts.ts`; this only writes them.
 *
 * Comprobante: SubTotal and Total 0, Moneda XXX, no FormaPago, MetodoPago or Impuestos.
 * Receptor: UsoCFDI CP01. One concepto 84111506 / ACT / "Pago" with ObjetoImp 01, written with a
 * closing tag so `buildCadenaOriginal` picks it up.
 */
export function buildPaymentXml(params: BuildPaymentXmlParams): string {
  const { payment, documents, profile, client } = params
  if (documents.length === 0) throw new Error('El complemento de pago necesita al menos una factura.')

  const fecha = formatCfdiDate(payment.issuedAt)
  const taxes = computePaymentTaxes(documents.map((d) => d.amounts))
  const currency = payment.currency ?? 'MXN'
  const exchangeRate = currency === 'MXN' ? 1 : payment.exchangeRate ?? 0
  if (currency !== 'MXN' && !(exchangeRate > 0)) throw new Error('El cobro en dólares necesita el tipo de cambio del día del pago.')
  const totals = computePaymentTotals([{ amount: payment.amount, exchangeRate, taxes }])

  let xml = '<?xml version="1.0" encoding="UTF-8"?>'
  xml += '<cfdi:Comprobante'
  xml += ` xmlns:cfdi="${CFDI_NAMESPACE}"`
  xml += ` xmlns:xsi="${XSI_NAMESPACE}"`
  xml += ` xmlns:pago20="${PAGOS_NAMESPACE}"`
  xml += ` xsi:schemaLocation="${CFDI_SCHEMA_LOCATION} ${PAGOS_SCHEMA_LOCATION}"`
  xml += ' Version="4.0"'
  xml += ` Serie="${esc(payment.serie)}"`
  xml += ` Folio="${payment.folio}"`
  xml += ` Fecha="${fecha}"`
  xml += ' Sello=""'
  xml += ` NoCertificado="${esc(toNoCertificado(params.certificateNumber))}"`
  xml += ` Certificado="${cleanCertificate(params.certificateBase64)}"`
  xml += ' SubTotal="0"'
  xml += ' Moneda="XXX"'
  xml += ' Total="0"'
  xml += ' TipoDeComprobante="P"'
  xml += ' Exportacion="01"'
  xml += ` LugarExpedicion="${esc(profile.postalCode)}"`
  xml += '>'

  if (payment.relatedUuid) xml += cfdiRelacionadosXml(RELATION_SUBSTITUTION, [payment.relatedUuid])

  xml += `<cfdi:Emisor Rfc="${esc(profile.rfc)}" Nombre="${esc(profile.businessName)}" RegimenFiscal="${esc(profile.taxRegime)}"/>`
  xml += receptorXml(client, { cfdiUsage: 'CP01', issuerPostalCode: profile.postalCode })

  xml += '<cfdi:Conceptos>'
  xml += '<cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago" ValorUnitario="0" Importe="0" ObjetoImp="01"></cfdi:Concepto>'
  xml += '</cfdi:Conceptos>'

  xml += '<cfdi:Complemento><pago20:Pagos Version="2.0">'

  xml += '<pago20:Totales'
  for (const [key, attribute] of TOTALS_ATTRIBUTES) {
    const value = totals[key]
    if (value !== undefined) xml += ` ${attribute}="${toFixed2(value)}"`
  }
  xml += '/>'

  xml += '<pago20:Pago'
  xml += ` FechaPago="${formatPaymentDate(payment.paidOn, fecha)}"`
  xml += ` FormaDePagoP="${esc(payment.paymentForm)}"`
  xml += ` MonedaP="${esc(currency)}"`
  // In MXN, TipoCambioP is "1" without decimals (CRP20215); otherwise the rate of the payment day, up to 6 decimals.
  xml += ` TipoCambioP="${currency === 'MXN' ? '1' : Number(exchangeRate.toFixed(6))}"`
  xml += ` Monto="${toFixed2(payment.amount)}"`
  if (payment.operationNumber) xml += ` NumOperacion="${esc(payment.operationNumber)}"`
  xml += '>'
  xml += documents.map(documentXml).join('')

  if (taxes.retentions.length > 0 || taxes.transfers.length > 0) {
    xml += '<pago20:ImpuestosP>'
    if (taxes.retentions.length > 0) {
      xml += '<pago20:RetencionesP>'
      for (const r of taxes.retentions) xml += `<pago20:RetencionP ImpuestoP="${r.tax}" ImporteP="${toFixed2(r.amount)}"/>`
      xml += '</pago20:RetencionesP>'
    }
    if (taxes.transfers.length > 0) {
      xml += '<pago20:TrasladosP>'
      for (const t of taxes.transfers) {
        xml += `<pago20:TrasladoP BaseP="${toFixed2(t.base)}" ImpuestoP="${t.tax}" TipoFactorP="${t.factorType}"`
        if (t.factorType !== 'Exento') xml += ` TasaOCuotaP="${t.rate}" ImporteP="${toFixed2(t.amount ?? 0)}"`
        xml += '/>'
      }
      xml += '</pago20:TrasladosP>'
    }
    xml += '</pago20:ImpuestosP>'
  }

  xml += '</pago20:Pago></pago20:Pagos></cfdi:Complemento>'
  xml += '</cfdi:Comprobante>'
  return xml
}
