/**
 * SAT status service (ConsultaCFDIService): whether a CFDI is valid or cancelled, whether it can be
 * cancelled and with what acceptance, and where its cancellation request stands.
 *
 * It is public (no credentials). The SAT itself does not know the CFDI stamped in SW's sandbox, so
 * with the sandbox the query goes to SW's copy of the service, which only knows those.
 */

const SAT_STATUS_URL = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc'
const SW_TEST_STATUS_URL = 'https://api.test.sw.com.mx/ConsultaCFDIService.svc'
const SOAP_ACTION = 'http://tempuri.org/IConsultaCFDIService/Consulta'
const TIMEOUT_MS = 10_000

export type SatCfdiState = 'vigente' | 'cancelado' | 'no_encontrado'

export interface SatCfdiStatus {
  /** CodigoEstatus, e.g. "S - Comprobante obtenido satisfactoriamente." or "N - 602: Comprobante no encontrado." */
  code: string
  state: SatCfdiState
  /** EsCancelable: "Cancelable sin aceptación", "Cancelable con aceptación" or "No cancelable". */
  cancellable: string | null
  /** EstatusCancelacion: "En proceso", "Plazo vencido", "Solicitud rechazada", "Cancelado sin aceptación"… */
  cancellationStatus: string | null
}

export interface SatStatusQuery {
  issuerRfc: string
  receiverRfc: string
  /** Total of the CFDI, as stamped. */
  total: string | number
  uuid: string
  /** Last 8 characters of the CFDI seal (fe); optional for the service. */
  sealTail?: string | null
}

/** `SAT_STATUS_URL` when set; otherwise SW's copy while stamping in SW's sandbox, and the SAT in production. */
export function satStatusUrl(): string {
  if (process.env.SAT_STATUS_URL) return process.env.SAT_STATUS_URL
  return process.env.SW_URL?.includes('.test.') ? SW_TEST_STATUS_URL : SAT_STATUS_URL
}

/** `tt`: up to 6 decimals without trailing zeros, keeping one (11449.15, 1000.0, 0.0). */
export function formatExpressionTotal(total: string | number): string {
  return Number(total).toFixed(6).replace(/0+$/, '').replace(/\.$/, '.0')
}

/** The expresionImpresa. The SAT reads it as XML, so an "&" inside an RFC goes as `&amp;`. */
export function buildStatusExpression(query: SatStatusQuery): string {
  const rfc = (value: string) => value.replace(/&/g, '&amp;')
  let expression = `?re=${rfc(query.issuerRfc)}&rr=${rfc(query.receiverRfc)}&tt=${formatExpressionTotal(query.total)}&id=${query.uuid}`
  if (query.sealTail) expression += `&fe=${query.sealTail}`
  return expression
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Text of `<a:Name>…</a:Name>`; null when empty, self-closed or `i:nil`. */
function readElement(body: string, name: string): string | null {
  const match = body.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?(?:/>|>([^<]*)</(?:\\w+:)?${name}>)`))
  const value = match?.[1]?.trim()
  return value ? decodeEntities(value) : null
}

/**
 * Reads the Consulta response. Tolerates the differences of SW's copy: no final period in
 * CodigoEstatus, `i:nil` for empty values and "No encontrado" in lower case.
 */
export function parseSatStatusResponse(body: string): SatCfdiStatus {
  const code = readElement(body, 'CodigoEstatus')
  if (!code) throw new Error('El SAT respondió sin estatus.')
  const estado = readElement(body, 'Estado')?.toLowerCase()
  const state: SatCfdiState = estado === 'vigente' ? 'vigente' : estado === 'cancelado' ? 'cancelado' : 'no_encontrado'
  return {
    code,
    state,
    // Without a CFDI, SW's copy still fills EsCancelable; it means nothing then.
    cancellable: state === 'no_encontrado' ? null : readElement(body, 'EsCancelable'),
    cancellationStatus: readElement(body, 'EstatusCancelacion'),
  }
}

/** Asks the SAT (or SW's copy in the sandbox) for the status of a CFDI. Throws when the service does not answer. */
export async function getSatCfdiStatus(query: SatStatusQuery): Promise<SatCfdiStatus> {
  const envelope = '<?xml version="1.0" encoding="utf-8"?>'
    + '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>'
    + `<Consulta xmlns="http://tempuri.org/"><expresionImpresa><![CDATA[${buildStatusExpression(query)}]]></expresionImpresa></Consulta>`
    + '</s:Body></s:Envelope>'

  const response = await fetch(satStatusUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: SOAP_ACTION },
    body: envelope,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  const body = await response.text()
  if (!response.ok) throw new Error(`El servicio de consulta del SAT respondió ${response.status}.`)
  return parseSatStatusResponse(body)
}

function readAttribute(xml: string, element: string, attribute: string): string | undefined {
  const tag = xml.match(new RegExp(`<${element}\\s[^>]*>`))?.[0]
  const value = tag?.match(new RegExp(`\\s${attribute}="([^"]*)"`))?.[1]
  return value === undefined ? undefined : decodeEntities(value)
}

/** The query of a stamped CFDI, read from its XML so it matches what the SAT has. */
export function statusQueryFromCfdi(xml: string): SatStatusQuery {
  const issuerRfc = readAttribute(xml, 'cfdi:Emisor', 'Rfc')
  const receiverRfc = readAttribute(xml, 'cfdi:Receptor', 'Rfc')
  const total = readAttribute(xml, 'cfdi:Comprobante', 'Total')
  const uuid = readAttribute(xml, 'tfd:TimbreFiscalDigital', 'UUID')
  const seal = readAttribute(xml, 'cfdi:Comprobante', 'Sello')
  if (!issuerRfc || !receiverRfc || total === undefined || !uuid) throw new Error('El XML no tiene los datos para consultar al SAT.')
  return { issuerRfc, receiverRfc, total, uuid, sealTail: seal ? seal.slice(-8) : null }
}
