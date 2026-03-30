// ── SW Sapien API Response ────────────────────────────────────────────────────

export interface SwApiResponse<T = SwStampData> {
  status: 'success' | 'error'
  data: T | null
  message?: string
  messageDetail?: string
}

export interface SwStampData {
  uuid: string
  cfdi: string
  fechaTimbrado: string
  cadenaOriginalSAT: string
  noCertificadoSAT: string
  noCertificadoCFDI: string
  selloSAT: string
  selloCFDI: string
  qrCode: string
}

// ── Stamping ─────────────────────────────────────────────────────────────────

export interface StampingResult {
  success: boolean
  uuid?: string
  cfdi?: string
  stampedAt?: string
  satCertificateNumber?: string
  cfdiCertificateNumber?: string
  satSignature?: string
  cfdiSignature?: string
  satOriginalChain?: string
  qrCode?: string
  error?: string
}

// ── Cancellation ─────────────────────────────────────────────────────────────

export interface CancellationResult {
  success: boolean
  acknowledgment?: string
  error?: string
}

export interface CancellationParams {
  uuid: string
  issuerRfc: string
  reason: '01' | '02' | '03' | '04'
  replacementUuid?: string
  cerBase64: string
  keyBase64: string
  keyPassword: string
}

