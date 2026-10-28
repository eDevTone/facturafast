import type {
  StampingResult,
  CancellationResult,
  CancellationParams,
  SwApiResponse,
  SwStampData,
} from '../types/stamping.types'
import { explainStampingError } from '../utils/stamping-errors'

function getConfig() {
  const url = process.env.SW_URL
  const token = process.env.SW_TOKEN

  if (!url) throw new Error('SW_URL is not configured')
  if (!token) throw new Error('SW_TOKEN is not configured')

  return { url, token }
}

export async function stampInvoice(sealedXml: string): Promise<StampingResult> {
  const { url, token } = getConfig()

  const endpoint = `${url}/cfdi33/stamp/v4`

  // Never log the XML: it carries RFCs, names and amounts of third parties.
  console.log('[SW] Stamping request:', { xmlLength: sealedXml.length })

  // SW expects multipart/form-data with the XML as a file field named "xml"
  const boundary = `----FormBoundary${Date.now()}`
  let body = ''
  body += `--${boundary}\r\n`
  body += `Content-Disposition: form-data; name="xml"; filename="xml"\r\n`
  body += `Content-Type: text/xml\r\n`
  body += `\r\n`
  body += sealedXml
  body += `\r\n`
  body += `--${boundary}--\r\n`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  })

  const result: SwApiResponse<SwStampData> = await response.json()

  console.log('[SW] Response status:', response.status, result.status)

  if (result.status === 'error' || !result.data) {
    // 307: this exact sealed XML was stamped before, and SW sends the stamped CFDI back.
    // Resending a sealed XML is how an unconfirmed stamping is recovered without stamping twice.
    if (result.message?.startsWith('307') && result.messageDetail?.includes('TimbreFiscalDigital')) {
      console.log('[SW] Already stamped (307); recovering the previous stamp')
      return stampingResultFromCfdi(result.messageDetail)
    }

    console.error('[SW] Stamping failed:', {
      message: result.message,
      messageDetail: isXml(result.messageDetail) ? '(XML omitted)' : result.messageDetail,
      httpStatus: response.status,
    })
    const explained = explainStampingError(swErrorMessage(result, 'Error al timbrar el comprobante'))
    return { success: false, error: explained.message, fix: explained.fix }
  }

  console.log('[SW] Stamping successful:', {
    uuid: result.data.uuid,
    stampedAt: result.data.fechaTimbrado,
  })

  return {
    success: true,
    uuid: result.data.uuid,
    cfdi: result.data.cfdi,
    stampedAt: result.data.fechaTimbrado,
    satCertificateNumber: result.data.noCertificadoSAT,
    cfdiCertificateNumber: result.data.noCertificadoCFDI,
    satSignature: result.data.selloSAT,
    cfdiSignature: result.data.selloCFDI,
    satOriginalChain: result.data.cadenaOriginalSAT,
    qrCode: result.data.qrCode,
  }
}

export async function cancelInvoice(params: CancellationParams): Promise<CancellationResult> {
  const { url, token } = getConfig()

  const body = {
    uuid: params.uuid,
    rfc: params.issuerRfc,
    b64Cer: params.cerBase64,
    b64Key: params.keyBase64,
    password: params.keyPassword,
    motivo: params.reason,
    ...(params.replacementUuid && { folioSustitucion: params.replacementUuid }),
  }

  console.log('[SW] Cancellation request:', { uuid: params.uuid, reason: params.reason })

  const response = await fetch(`${url}/cfdi33/cancel/csd`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const result: SwApiResponse<{ acuse: string; uuid?: Record<string, string> }> = await response.json()

  // The SAT answers per UUID inside a "success" response: only 201 and 202 mean the request went through.
  const code = Object.entries(result.data?.uuid ?? {})
    .find(([uuid]) => uuid.toLowerCase() === params.uuid.toLowerCase())?.[1]

  console.log('[SW] Cancel response:', response.status, result.status, code)

  if (result.status === 'error' || !result.data) {
    return {
      success: false,
      error: swErrorMessage(result, 'Error al cancelar la factura'),
    }
  }

  if (code && code !== '201' && code !== '202') {
    return { success: false, code, error: cancellationCodeMessage(code) }
  }

  return {
    success: true,
    code,
    acknowledgment: result.data.acuse,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The SAT's cancellation codes in plain words. The SAT does not publish the list; it comes from
 * the PACs' documentation (SW Sapien, Finkok).
 */
const CANCELLATION_CODE_MESSAGES: Record<string, string> = {
  '203': 'El folio fiscal no corresponde a tu RFC.',
  '204': 'El SAT indica que este comprobante no aplica para cancelación.',
  '205': 'El SAT aún no registra este comprobante. Si lo acabas de timbrar, intenta en unos minutos.',
  '206': 'El comprobante no es del sector primario.',
  '207': 'El SAT no aceptó el motivo o el folio de la factura que la sustituye.',
  '208': 'El folio de la factura que la sustituye no es válido.',
  '209': 'Este motivo no lleva folio de sustitución.',
  '210': 'Ya venció el plazo para cancelar este comprobante.',
  '211': 'Ya venció el plazo para cancelar la factura global.',
  '212': 'El SAT no encontró la relación con la factura que la sustituye. Si la acabas de timbrar, intenta en unos minutos.',
}

function cancellationCodeMessage(code: string): string {
  const message = CANCELLATION_CODE_MESSAGES[code]
    ?? (code.startsWith('3') ? 'El SAT rechazó la solicitud por el certificado o el formato.' : 'El SAT no aceptó la solicitud de cancelación.')
  return `${code} - ${message}`
}

function isXml(value: string | undefined): boolean {
  return !!value && value.trimStart().startsWith('<')
}

/**
 * What the user reads when SW rejects a request. `message` carries the SAT code and the reason
 * ("CRP20212 - El valor del campo FormaDePagoP debe ser distinto de “99”."); `messageDetail`
 * only adds an explanation or the expected values, so it is the fallback.
 */
function swErrorMessage(result: SwApiResponse<unknown>, fallback: string): string {
  const message = result.message?.trim()
  const detail = isXml(result.messageDetail) ? undefined : result.messageDetail?.trim()
  return message || detail || fallback
}

function readCfdiAttribute(xml: string, element: string, attribute: string): string | undefined {
  const tag = xml.match(new RegExp(`<${element}\\s[^>]*>`))?.[0]
  return tag?.match(new RegExp(`\\s${attribute}="([^"]*)"`))?.[1]
}

/**
 * Rebuilds a stamping result from a stamped CFDI (the 307 answer). SW sends no QR image in this
 * case; the TFD cadena original is rebuilt as `||Version|UUID|FechaTimbrado|RfcProvCertif|SelloCFD|NoCertificadoSAT||`.
 */
function stampingResultFromCfdi(cfdi: string): StampingResult {
  const tfd = (attribute: string) => readCfdiAttribute(cfdi, 'tfd:TimbreFiscalDigital', attribute)
  const uuid = tfd('UUID')
  if (!uuid) return { success: false, error: 'El comprobante ya estaba timbrado, pero no se pudo leer su timbre.' }

  const leyenda = tfd('Leyenda')
  const chain = [tfd('Version'), uuid, tfd('FechaTimbrado'), tfd('RfcProvCertif'), ...(leyenda ? [leyenda] : []), tfd('SelloCFD'), tfd('NoCertificadoSAT')]
  return {
    success: true,
    uuid,
    cfdi,
    stampedAt: tfd('FechaTimbrado'),
    satCertificateNumber: tfd('NoCertificadoSAT'),
    cfdiCertificateNumber: readCfdiAttribute(cfdi, 'cfdi:Comprobante', 'NoCertificado'),
    satSignature: tfd('SelloSAT'),
    cfdiSignature: tfd('SelloCFD'),
    satOriginalChain: `||${chain.join('|')}||`,
  }
}
