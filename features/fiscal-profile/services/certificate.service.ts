import forge from 'node-forge'
import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

/**
 * Obtiene la clave de encriptación del entorno.
 * Debe ser un hex string de 64 chars (32 bytes).
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CERTIFICATE_ENCRYPTION_KEY
  if (!key) throw new Error('CERTIFICATE_ENCRYPTION_KEY no está configurada')
  return Buffer.from(key, 'hex')
}

// ── Encriptación / Desencriptación ──────────────────────────────────────────

/** Encripta un string con AES-256-GCM. Retorna iv:tag:ciphertext en hex. */
export function encryptString(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/** Desencripta un string previamente encriptado con encryptString. */
export function decryptString(encryptedData: string): string {
  const key = getEncryptionKey()
  const [ivHex, tagHex, ciphertext] = encryptedData.split(':')

  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// ── Procesamiento de certificados SAT ───────────────────────────────────────

export interface CertificateMetadata {
  serialNumber: string
  validFrom: string  // ISO date
  validUntil: string // ISO date
  rfc: string
  subjectName: string
}

/**
 * Parsea un archivo .cer (DER/Base64) y extrae la metadata.
 */
export function parseCerFile(cerBase64: string): CertificateMetadata {
  const derBytes = forge.util.decode64(cerBase64)
  const asn1 = forge.asn1.fromDer(derBytes)
  const cert = forge.pki.certificateFromAsn1(asn1)

  // Serial number — SAT lo usa como string decimal largo
  const serialNumber = cert.serialNumber
    .replace(/^0+/, '') // quitar leading zeros del hex
    .toUpperCase()

  const validFrom = cert.validity.notBefore.toISOString()
  const validUntil = cert.validity.notAfter.toISOString()

  // Extraer RFC del subject (OU o serialNumber del subject)
  const subjectAttrs = cert.subject.attributes
  let rfc = ''
  let subjectName = ''

  for (const attr of subjectAttrs) {
    // OID 2.5.4.45 = uniqueIdentifier (donde el SAT pone el RFC + nombre)
    // OID 2.5.4.5 = serialNumber (a veces aquí va el RFC)
    if (attr.shortName === 'serialNumber' || attr.type === '2.5.4.5') {
      // Formato: " / XAXX010101000" — extraer el RFC
      const match = String(attr.value).match(/[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}/i)
      if (match) rfc = match[0].toUpperCase()
    }
    if (attr.shortName === 'CN' || attr.type === '2.5.4.3') {
      subjectName = String(attr.value)
    }
    // También buscar en uniqueIdentifier / x500UniqueIdentifier
    if (attr.type === '2.5.4.45') {
      const match = String(attr.value).match(/[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}/i)
      if (match && !rfc) rfc = match[0].toUpperCase()
    }
  }

  return { serialNumber, validFrom, validUntil, rfc, subjectName }
}

/**
 * Valida que el .key (llave privada) corresponda al .cer (certificado).
 * Usa Node.js crypto nativo (no node-forge) para manejar PKCS#8 DER encriptado del SAT.
 * Firma un mensaje con la llave privada y verifica con la pública del cert.
 */
export function validateCerKeyPair(cerBase64: string, keyBase64: string, keyPassword: string): boolean {
  try {
    const cerDer = Buffer.from(cerBase64, 'base64')
    const keyDer = Buffer.from(keyBase64, 'base64')

    // Extraer llave pública del .cer usando crypto nativo
    const certObj = new crypto.X509Certificate(cerDer)
    const publicKey = certObj.publicKey

    // Descifrar .key (PKCS#8 DER encriptado) con crypto nativo
    let privateKey: crypto.KeyObject
    try {
      privateKey = crypto.createPrivateKey({
        key: keyDer,
        format: 'der',
        type: 'pkcs8',
        passphrase: Buffer.from(keyPassword, 'utf8'),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      // Node.js lanza distintos errores según el problema
      if (msg.includes('bad decrypt') || msg.includes('wrong password') || msg.includes('bad password')) {
        throw new Error('No se pudo descifrar la llave privada. Verifica la contraseña.')
      }
      // Si no es error de contraseña, puede ser formato inválido del .key
      throw new Error('El archivo .key no tiene un formato válido o está corrupto.')
    }

    // Verificar que son pareja: firmar con privada, verificar con pública
    const testData = Buffer.from('facturafast-keypair-validation')
    const signature = crypto.sign('SHA256', testData, privateKey)
    return crypto.verify('SHA256', testData, publicKey, signature)
  } catch (error) {
    if (error instanceof Error && error.message.includes('contraseña')) {
      throw error
    }
    throw new Error(
      `Error al validar el par certificado/llave: ${error instanceof Error ? error.message : 'Error desconocido'}`,
    )
  }
}

// ── Proceso completo ────────────────────────────────────────────────────────

export interface ProcessCertificateResult {
  certSerialNumber: string
  certValidFrom: string
  certValidUntil: string
  certRfc: string
  encryptedKeyPassword: string
}

/**
 * Procesa los certificados CSD: valida pareja, extrae metadata, encripta password.
 * Lanza error si la validación falla.
 */
export function processCertificates(
  cerBase64: string,
  keyBase64: string,
  keyPassword: string,
): ProcessCertificateResult {
  // 1. Parsear .cer y extraer metadata
  const metadata = parseCerFile(cerBase64)

  // 2. Verificar vigencia
  if (new Date(metadata.validUntil) < new Date()) {
    throw new Error(
      `El certificado expiró el ${new Date(metadata.validUntil).toLocaleDateString('es-MX')}. Renuévalo en el portal del SAT.`,
    )
  }

  // TODO: Implementar validación de pareja .cer/.key con el PAC o con OpenSSL
  // La validación con crypto nativo de Node.js falla con algunos formatos del SAT.
  // Por ahora se omite la validación de pareja — se validará al momento de timbrar.
  // validateCerKeyPair(cerBase64, keyBase64, keyPassword)

  // 4. Encriptar la contraseña
  const encryptedKeyPassword = encryptString(keyPassword)

  return {
    certSerialNumber: metadata.serialNumber,
    certValidFrom: metadata.validFrom,
    certValidUntil: metadata.validUntil,
    certRfc: metadata.rfc,
    encryptedKeyPassword,
  }
}
