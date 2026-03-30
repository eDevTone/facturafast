import type {
  StampingResult,
  CancellationResult,
  CancellationParams,
  SwApiResponse,
  SwStampData,
} from '../types/stamping.types'

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

  console.log('[SW] Stamping request:', { endpoint, xmlLength: sealedXml.length })
  console.log('[SW] XML preview:', sealedXml.substring(0, 500))

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

  console.log('[SW] Response status:', response.status)
  console.log('[SW] Response body:', JSON.stringify(result, null, 2))

  if (result.status === 'error' || !result.data) {
    console.error('[SW] Stamping failed:', {
      message: result.message,
      messageDetail: result.messageDetail,
      httpStatus: response.status,
    })
    return {
      success: false,
      error: result.messageDetail || result.message || 'Error al timbrar la factura',
    }
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

  console.log('[SW] Cancellation request:', { uuid: params.uuid, rfc: params.issuerRfc, reason: params.reason })

  const response = await fetch(`${url}/cfdi33/cancel/csd`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const result: SwApiResponse<{ acuse: string }> = await response.json()

  console.log('[SW] Cancel response:', response.status, JSON.stringify(result, null, 2))

  if (result.status === 'error' || !result.data) {
    return {
      success: false,
      error: result.messageDetail || result.message || 'Error al cancelar la factura',
    }
  }

  return {
    success: true,
    acknowledgment: result.data.acuse,
  }
}
