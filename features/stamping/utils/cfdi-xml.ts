/** Helpers shared by the CFDI XML builders (invoice and complemento de pago). */

export const CFDI_NAMESPACE = 'http://www.sat.gob.mx/cfd/4'
export const XSI_NAMESPACE = 'http://www.w3.org/2001/XMLSchema-instance'
export const CFDI_SCHEMA_LOCATION = 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd'

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** c_TipoRelacion "Sustitución de los CFDI previos": the only relation a correction uses. */
export const RELATION_SUBSTITUTION = '04'

/**
 * The cfdi:CfdiRelacionados node of one relation type, with a CfdiRelacionado per UUID. It goes
 * after InformacionGlobal and before Emisor.
 */
export function cfdiRelacionadosXml(relationType: string, uuids: string[]): string {
  const related = uuids.map((uuid) => `<cfdi:CfdiRelacionado UUID="${esc(uuid)}"/>`).join('')
  return `<cfdi:CfdiRelacionados TipoRelacion="${esc(relationType)}">${related}</cfdi:CfdiRelacionados>`
}

/** RFC genérico de un residente en el extranjero. */
const FOREIGN_RFC = 'XEXX010101000'

export interface ReceptorData {
  rfc: string
  businessName: string
  /** Mexican fiscal postal code; null for a receptor abroad. */
  postalCode: string | null
  taxRegime: string | null
  /** c_Pais of a receptor abroad. */
  country?: string | null
  /** NumRegIdTrib of a receptor abroad. */
  foreignTaxId?: string | null
}

/**
 * The cfdi:Receptor node. A receptor abroad (XEXX010101000) takes the issuer's postal code
 * (CFDI40149), régimen 616 (CFDI40159), its ResidenciaFiscal and, when known, its NumRegIdTrib.
 */
export function receptorXml(receptor: ReceptorData, { cfdiUsage, issuerPostalCode }: { cfdiUsage: string; issuerPostalCode: string }): string {
  const abroad = receptor.rfc === FOREIGN_RFC
  let xml = '<cfdi:Receptor'
  xml += ` Rfc="${esc(receptor.rfc)}"`
  xml += ` Nombre="${esc(receptor.businessName)}"`
  xml += ` DomicilioFiscalReceptor="${esc(abroad ? issuerPostalCode : receptor.postalCode ?? '')}"`
  if (abroad && receptor.country) xml += ` ResidenciaFiscal="${esc(receptor.country)}"`
  if (abroad && receptor.foreignTaxId) xml += ` NumRegIdTrib="${esc(receptor.foreignTaxId)}"`
  xml += ` RegimenFiscalReceptor="${esc(abroad ? '616' : receptor.taxRegime || '616')}"`
  xml += ` UsoCFDI="${esc(cfdiUsage)}"`
  xml += '/>'
  return xml
}

/** `YYYY-MM-DDThh:mm:ss` in Mexico City time, as the SAT requires. */
export function formatCfdiDate(date: Date): string {
  const mx = new Date(date).toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
  const d = new Date(mx)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** Today in Mexico City, YYYY-MM-DD. */
export function todayInMexico(): string {
  return formatCfdiDate(new Date()).slice(0, 10)
}

/** NoCertificado must be the 20 ASCII digits; a serial stored in hex (>20 chars) is converted. */
export function toNoCertificado(certificateNumber: string): string {
  if (/^[0-9a-fA-F]+$/.test(certificateNumber) && certificateNumber.length > 20) {
    return Buffer.from(certificateNumber, 'hex').toString('ascii')
  }
  return certificateNumber
}

/** The Certificado attribute: the .cer in base64, without line breaks or spaces. */
export function cleanCertificate(certificateBase64: string): string {
  return certificateBase64.replace(/[\s\r\n]/g, '')
}
