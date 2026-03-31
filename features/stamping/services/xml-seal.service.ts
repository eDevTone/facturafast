import crypto from 'node:crypto'

/**
 * Generates the "cadena original" from a CFDI 4.0 XML string.
 *
 * Attribute order follows SAT's Anexo 20 XSLT (cadenaoriginal_4_0.xslt).
 * Format: ||attr1|attr2|...|attrN||
 */
export function buildCadenaOriginal(xml: string): string {
  const parts: string[] = []

  // ── Comprobante ──────────────────────────────────────────────────────────
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Version'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Serie'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Folio'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Fecha'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'FormaPago'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'NoCertificado'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'CondicionesDePago'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'SubTotal'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Descuento'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Moneda'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'TipoCambio'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Total'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'TipoDeComprobante'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Exportacion'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'MetodoPago'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'LugarExpedicion'))
  parts.push(extractAttr(xml, 'cfdi:Comprobante', 'Confirmacion'))

  // ── Emisor ───────────────────────────────────────────────────────────────
  parts.push(extractAttr(xml, 'cfdi:Emisor', 'Rfc'))
  parts.push(extractAttr(xml, 'cfdi:Emisor', 'Nombre'))
  parts.push(extractAttr(xml, 'cfdi:Emisor', 'RegimenFiscal'))
  parts.push(extractAttr(xml, 'cfdi:Emisor', 'FacAtrAdquirente'))

  // ── Receptor (order per XSLT: Rfc, Nombre, DomFiscal, Residencia, NumReg, Regimen, Uso) ──
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'Rfc'))
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'Nombre'))
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'DomicilioFiscalReceptor'))
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'ResidenciaFiscal'))
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'NumRegIdTrib'))
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'RegimenFiscalReceptor'))
  parts.push(extractAttr(xml, 'cfdi:Receptor', 'UsoCFDI'))

  // ── Conceptos (each Concepto with its nested taxes) ──────────────────────
  const conceptBlocks = [...xml.matchAll(/<cfdi:Concepto\s[^>]*>[\s\S]*?<\/cfdi:Concepto>/g)]
  for (const block of conceptBlocks) {
    const conceptTag = block[0].match(/<cfdi:Concepto\s[^>]*>/)?.[0] || ''

    // Concepto attributes
    parts.push(extractAttrFromTag(conceptTag, 'ClaveProdServ'))
    parts.push(extractAttrFromTag(conceptTag, 'NoIdentificacion'))
    parts.push(extractAttrFromTag(conceptTag, 'Cantidad'))
    parts.push(extractAttrFromTag(conceptTag, 'ClaveUnidad'))
    parts.push(extractAttrFromTag(conceptTag, 'Unidad'))
    parts.push(extractAttrFromTag(conceptTag, 'Descripcion'))
    parts.push(extractAttrFromTag(conceptTag, 'ValorUnitario'))
    parts.push(extractAttrFromTag(conceptTag, 'Importe'))
    parts.push(extractAttrFromTag(conceptTag, 'Descuento'))
    parts.push(extractAttrFromTag(conceptTag, 'ObjetoImp'))

    // Per-concept Traslados (inside this Concepto)
    const conceptTraslados = [...block[0].matchAll(/<cfdi:Traslado\s[^>]*\/?>/g)]
    for (const t of conceptTraslados) {
      parts.push(extractAttrFromTag(t[0], 'Base'))
      parts.push(extractAttrFromTag(t[0], 'Impuesto'))
      parts.push(extractAttrFromTag(t[0], 'TipoFactor'))
      parts.push(extractAttrFromTag(t[0], 'TasaOCuota'))
      parts.push(extractAttrFromTag(t[0], 'Importe'))
    }

    // Per-concept Retenciones (inside this Concepto)
    const conceptRetenciones = [...block[0].matchAll(/<cfdi:Retencion\s[^>]*\/?>/g)]
    for (const r of conceptRetenciones) {
      parts.push(extractAttrFromTag(r[0], 'Base'))
      parts.push(extractAttrFromTag(r[0], 'Impuesto'))
      parts.push(extractAttrFromTag(r[0], 'TipoFactor'))
      parts.push(extractAttrFromTag(r[0], 'TasaOCuota'))
      parts.push(extractAttrFromTag(r[0], 'Importe'))
    }
  }

  // ── Global Impuestos (directly under Comprobante) ────────────────────────
  // XSLT order: Retenciones(Impuesto,Importe) → TotalImpuestosRetenidos → Traslados(Base,Impuesto,TipoFactor,TasaOCuota,Importe) → TotalImpuestosTrasladados
  const globalImpMatch = xml.match(/<cfdi:Impuestos\s+Total[^>]*>[\s\S]*?<\/cfdi:Impuestos>/)
  if (globalImpMatch) {
    const impBlock = globalImpMatch[0]

    // Global Retenciones (only Impuesto + Importe per XSLT)
    const globalRetenciones = impBlock.match(/<cfdi:Retenciones>[\s\S]*?<\/cfdi:Retenciones>/)
    if (globalRetenciones) {
      const retMatches = [...globalRetenciones[0].matchAll(/<cfdi:Retencion\s[^>]*\/?>/g)]
      for (const r of retMatches) {
        parts.push(extractAttrFromTag(r[0], 'Impuesto'))
        parts.push(extractAttrFromTag(r[0], 'Importe'))
      }
    }

    // TotalImpuestosRetenidos (between Retenciones and Traslados per XSLT)
    parts.push(extractAttrFromTag(impBlock, 'TotalImpuestosRetenidos'))

    // Global Traslados
    const globalTraslados = impBlock.match(/<cfdi:Traslados>[\s\S]*?<\/cfdi:Traslados>/)
    if (globalTraslados) {
      const trasMatches = [...globalTraslados[0].matchAll(/<cfdi:Traslado\s[^>]*\/?>/g)]
      for (const t of trasMatches) {
        parts.push(extractAttrFromTag(t[0], 'Base'))
        parts.push(extractAttrFromTag(t[0], 'Impuesto'))
        parts.push(extractAttrFromTag(t[0], 'TipoFactor'))
        parts.push(extractAttrFromTag(t[0], 'TasaOCuota'))
        parts.push(extractAttrFromTag(t[0], 'Importe'))
      }
    }

    // TotalImpuestosTrasladados (last per XSLT)
    parts.push(extractAttrFromTag(impBlock, 'TotalImpuestosTrasladados'))
  }

  const filtered = parts.filter(Boolean)
  return `||${filtered.join('|')}||`
}

/**
 * Signs the cadena original with the private key (SHA-256 + RSA).
 */
export function signCadenaOriginal(
  cadenaOriginal: string,
  keyBase64: string,
  keyPassword: string,
): string {
  const keyDer = Buffer.from(keyBase64, 'base64')

  const privateKey = crypto.createPrivateKey({
    key: keyDer,
    format: 'der',
    type: 'pkcs8',
    passphrase: Buffer.from(keyPassword, 'utf8'),
  })

  const signature = crypto.sign('SHA256', Buffer.from(cadenaOriginal, 'utf8'), privateKey)
  return signature.toString('base64')
}

/**
 * Seals a CFDI XML: generates cadena original, signs it, and sets the Sello attribute.
 */
export function sealXml(params: {
  xml: string
  cerBase64: string
  keyBase64: string
  keyPassword: string
}): string {
  const cadenaOriginal = buildCadenaOriginal(params.xml)

  console.log('[SEAL] Cadena original:', cadenaOriginal)
  console.log('[SEAL] XML to seal:', params.xml)

  const sello = signCadenaOriginal(cadenaOriginal, params.keyBase64, params.keyPassword)

  console.log('[SEAL] Sello generated, length:', sello.length)

  // Verify locally: decrypt sello with public key from .cer and compare
  try {
    const cerDer = Buffer.from(params.cerBase64, 'base64')
    const cert = new crypto.X509Certificate(cerDer)
    const publicKey = cert.publicKey
    const signatureBuffer = Buffer.from(sello, 'base64')
    const isValid = crypto.verify('SHA256', Buffer.from(cadenaOriginal, 'utf8'), publicKey, signatureBuffer)
    console.log('[SEAL] Local signature verification:', isValid ? 'VALID' : 'INVALID')
    if (!isValid) {
      console.error('[SEAL] WARNING: .cer and .key may not be a matching pair')
    }
  } catch (err) {
    console.error('[SEAL] Could not verify signature locally:', err)
  }

  return params.xml.replace('Sello=""', `Sello="${sello}"`)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractAttr(xml: string, tagName: string, attrName: string): string {
  // Match opening tag (including self-closing)
  const regex = new RegExp(`<${tagName}\\s[^>]*?/?>`, 's')
  const match = xml.match(regex)
  if (!match) return ''
  return extractAttrFromTag(match[0], attrName)
}

function extractAttrFromTag(tag: string, attrName: string): string {
  // Word boundary: attr must be preceded by space or start-of-string to avoid
  // "SubTotal" matching when looking for "Total", or "ClaveUnidad" matching "Unidad"
  const regex = new RegExp(`(?<=\\s)${attrName}="([^"]*)"`)
  const match = tag.match(regex)
  return match?.[1] || ''
}
