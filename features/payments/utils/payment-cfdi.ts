/**
 * Reads a stamped complemento de pago (CFDI 4.0 tipo P with Pagos 2.0) back from its XML.
 * The printed representation and the email show these values, so they always match what the SAT has.
 */

export interface PaymentCfdiTax {
  kind: 'retencion' | 'traslado'
  base: string
  tax: string
  factorType: string
  rate: string | null
  amount: string | null
}

export interface PaymentCfdiDocument {
  uuid: string
  serie: string | null
  folio: string | null
  currency: string
  equivalence: string | null
  installment: string
  previousBalance: string
  amountPaid: string
  remainingBalance: string
  taxObject: string
  taxes: PaymentCfdiTax[]
}

export interface PaymentCfdiPayment {
  paidAt: string
  paymentForm: string
  currency: string
  exchangeRate: string | null
  amount: string
  operationNumber: string | null
  documents: PaymentCfdiDocument[]
}

export interface PaymentCfdi {
  serie: string | null
  folio: string | null
  /** Fecha */
  issuedAt: string
  /** LugarExpedicion */
  postalCode: string
  certificateNumber: string
  emisor: { rfc: string; name: string; taxRegime: string }
  receptor: {
    rfc: string
    name: string
    postalCode: string
    taxRegime: string
    cfdiUsage: string
    /** ResidenciaFiscal of a receptor abroad. */
    country: string | null
    /** NumRegIdTrib of a receptor abroad. */
    foreignTaxId: string | null
  }
  /** cfdi:CfdiRelacionados: a complemento that replaces another one relates to it with 04. */
  related: { relationType: string; uuids: string[] }[]
  /** pago20:Totales, attribute name → value. */
  totals: Record<string, string>
  payments: PaymentCfdiPayment[]
  stamp: {
    uuid: string
    stampedAt: string
    pacRfc: string
    cfdiSignature: string
    satCertificateNumber: string
    satSignature: string
  } | null
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Attributes of an opening (or self-closing) tag. */
function attributesOf(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const [, name, value] of tag.matchAll(/\s([\w:]+)="([^"]*)"/g)) attributes[name] = decodeEntities(value)
  return attributes
}

function firstTag(xml: string, element: string): Record<string, string> {
  const tag = xml.match(new RegExp(`<${element}\\s[^>]*>`))?.[0]
  return tag ? attributesOf(tag) : {}
}

function allTags(xml: string, element: string): Record<string, string>[] {
  return [...xml.matchAll(new RegExp(`<${element}\\s[^>]*>`, 'g'))].map(([tag]) => attributesOf(tag))
}

function readDocument(block: string): PaymentCfdiDocument {
  const a = firstTag(block, 'pago20:DoctoRelacionado')
  const taxes = (kind: PaymentCfdiTax['kind'], element: string) =>
    allTags(block, element).map((t): PaymentCfdiTax => ({
      kind,
      base: t.BaseDR,
      tax: t.ImpuestoDR,
      factorType: t.TipoFactorDR,
      rate: t.TasaOCuotaDR ?? null,
      amount: t.ImporteDR ?? null,
    }))

  return {
    uuid: a.IdDocumento,
    serie: a.Serie ?? null,
    folio: a.Folio ?? null,
    currency: a.MonedaDR,
    equivalence: a.EquivalenciaDR ?? null,
    installment: a.NumParcialidad,
    previousBalance: a.ImpSaldoAnt,
    amountPaid: a.ImpPagado,
    remainingBalance: a.ImpSaldoInsoluto,
    taxObject: a.ObjetoImpDR,
    taxes: [...taxes('retencion', 'pago20:RetencionDR'), ...taxes('traslado', 'pago20:TrasladoDR')],
  }
}

export function readPaymentCfdi(xml: string): PaymentCfdi {
  const comprobante = firstTag(xml, 'cfdi:Comprobante')
  const emisor = firstTag(xml, 'cfdi:Emisor')
  const receptor = firstTag(xml, 'cfdi:Receptor')
  const tfd = firstTag(xml, 'tfd:TimbreFiscalDigital')

  const payments = [...xml.matchAll(/<pago20:Pago\s[^>]*>[\s\S]*?<\/pago20:Pago>/g)].map(([block]): PaymentCfdiPayment => {
    const p = firstTag(block, 'pago20:Pago')
    const documents = [...block.matchAll(/<pago20:DoctoRelacionado\s[^>]*?(?:\/>|>[\s\S]*?<\/pago20:DoctoRelacionado>)/g)]
      .map(([documentBlock]) => readDocument(documentBlock))
    return {
      paidAt: p.FechaPago,
      paymentForm: p.FormaDePagoP,
      currency: p.MonedaP,
      exchangeRate: p.TipoCambioP ?? null,
      amount: p.Monto,
      operationNumber: p.NumOperacion ?? null,
      documents,
    }
  })

  return {
    serie: comprobante.Serie ?? null,
    folio: comprobante.Folio ?? null,
    issuedAt: comprobante.Fecha,
    postalCode: comprobante.LugarExpedicion,
    certificateNumber: comprobante.NoCertificado,
    emisor: { rfc: emisor.Rfc, name: emisor.Nombre, taxRegime: emisor.RegimenFiscal },
    receptor: {
      rfc: receptor.Rfc,
      name: receptor.Nombre,
      postalCode: receptor.DomicilioFiscalReceptor,
      taxRegime: receptor.RegimenFiscalReceptor,
      cfdiUsage: receptor.UsoCFDI,
      country: receptor.ResidenciaFiscal ?? null,
      foreignTaxId: receptor.NumRegIdTrib ?? null,
    },
    related: [...xml.matchAll(/<cfdi:CfdiRelacionados\s[^>]*>[\s\S]*?<\/cfdi:CfdiRelacionados>/g)].map(([block]) => ({
      relationType: firstTag(block, 'cfdi:CfdiRelacionados').TipoRelacion,
      uuids: allTags(block, 'cfdi:CfdiRelacionado').map((tag) => tag.UUID),
    })),
    totals: firstTag(xml, 'pago20:Totales'),
    payments,
    stamp: tfd.UUID
      ? {
          uuid: tfd.UUID,
          stampedAt: tfd.FechaTimbrado,
          pacRfc: tfd.RfcProvCertif,
          cfdiSignature: tfd.SelloCFD,
          satCertificateNumber: tfd.NoCertificadoSAT,
          satSignature: tfd.SelloSAT,
        }
      : null,
  }
}
