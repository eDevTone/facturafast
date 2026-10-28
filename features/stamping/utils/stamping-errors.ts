/**
 * The PAC's rejections in plain words, with where the user fixes each one.
 *
 * Codes CFDI40xxx: "Matriz de códigos de error para el CFDI 4.0" (SAT, Anexo 20, file of 2026-03-25).
 * Codes 3xx and 4xx: validations SW Sapien runs before stamping (developers.sw.com.mx, "Error codes").
 * S2000: SW's answer when our account with SW runs out of stamps (seen in the sandbox on 2026-10-19).
 * A code that is not here keeps SW's own message, which already carries the code and the reason.
 */

/** Where the user fixes a rejection: the client, their fiscal profile (data or CSD), the draft, or nowhere (our error). */
export type StampingFix = 'client' | 'profile' | 'invoice' | 'support'

export interface StampingErrorExplanation {
  /** The plain message, ending with the code in parentheses so support can find it. */
  message: string
  fix?: StampingFix
}

const OUR_ERROR = 'Es un error de FacturaFast al armar la factura, no de tus datos. Escríbenos con este código y lo revisamos.'

const PAC_UNAVAILABLE =
  'No pudimos timbrar por un problema con nuestro proveedor de timbrado, no con tus datos. No se usó ninguno de tus timbres: intenta más tarde.'

const EXPLANATIONS: Record<string, { text: string; fix: StampingFix }> = {
  // The client (Receptor)
  CFDI40143: {
    fix: 'client',
    text: 'El SAT no encuentra el RFC de tu cliente entre los inscritos y activos. Revisa que esté bien escrito o pídele a tu cliente que te lo confirme.',
  },
  CFDI40144: {
    fix: 'client',
    text: 'El SAT no encuentra el RFC de tu cliente, así que no puede validar su nombre. Revisa que el RFC esté bien escrito.',
  },
  CFDI40145: {
    fix: 'client',
    text: 'El nombre de tu cliente no coincide con el que tiene en el SAT. Escríbelo tal como aparece en su constancia de situación fiscal, sin «S.A. de C.V.» ni otro régimen de capital.',
  },
  CFDI40147: {
    fix: 'client',
    text: 'El SAT no encuentra el RFC de tu cliente, así que no puede validar su código postal. Revisa que el RFC esté bien escrito.',
  },
  CFDI40148: {
    fix: 'client',
    text: 'El código postal de tu cliente no es el de su domicilio fiscal en el SAT. Usa el que aparece en su constancia de situación fiscal.',
  },
  CFDI40158: {
    fix: 'client',
    text: 'El régimen fiscal de tu cliente no corresponde a su tipo de persona: un RFC de 12 caracteres es de una empresa y uno de 13, de una persona física.',
  },
  CFDI40159: {
    fix: 'client',
    text: 'El régimen fiscal de tu cliente no es el que tiene registrado en el SAT. Usa el de su constancia de situación fiscal o pídele que te lo confirme.',
  },
  CFDI40161: {
    fix: 'invoice',
    text: 'El uso del CFDI no corresponde al régimen de tu cliente. Cámbialo en el borrador: para los gastos de una empresa suele ser G03, Gastos en general.',
  },

  // The user (Emisor) and their CSD
  CFDI40126: {
    fix: 'profile',
    text: 'El código postal de tu perfil fiscal no existe en el catálogo del SAT. Corrígelo con el de tu constancia de situación fiscal.',
  },
  CFDI40138: {
    fix: 'profile',
    text: 'El SAT no encuentra tu RFC entre los inscritos y activos, así que no puede validar tu nombre. Revisa el RFC de tu perfil fiscal.',
  },
  CFDI40139: {
    fix: 'profile',
    text: 'Tu nombre no coincide con el que tienes en el SAT. Corrígelo en tu perfil fiscal tal como aparece en tu constancia de situación fiscal.',
  },
  CFDI40141: {
    fix: 'profile',
    text: 'Tu régimen fiscal no corresponde a tu tipo de persona. Corrígelo en tu perfil fiscal con el de tu constancia de situación fiscal.',
  },
  '303': {
    fix: 'profile',
    text: 'El CSD que subiste es de otro RFC. Sube en tu perfil fiscal el CSD de este RFC.',
  },
  '304': {
    fix: 'profile',
    text: 'El SAT revocó tu CSD. Tramita uno nuevo y súbelo en tu perfil fiscal.',
  },
  '305': {
    fix: 'profile',
    text: 'Tu CSD no está vigente: ya venció o todavía no empieza su vigencia. Sube un CSD vigente en tu perfil fiscal.',
  },
  '306': {
    fix: 'profile',
    text: 'El certificado que subiste no es un CSD; puede ser tu e.firma. El CSD es otro certificado, que se tramita con tu e.firma en el SAT: súbelo en tu perfil fiscal.',
  },
  '308': {
    fix: 'profile',
    text: 'El certificado que subiste no lo emitió el SAT. Sube el CSD que descargaste de CertiSAT Web.',
  },
  '402': {
    fix: 'profile',
    text: 'Tu RFC todavía no aparece en la lista del SAT de quienes pueden facturar. Si acabas de tramitar tu CSD, el SAT puede tardar unos días en darlo de alta; si no, revisa en el SAT que tu CSD no esté restringido.',
  },

  // The draft's concepts and amounts
  CFDI40162: {
    fix: 'invoice',
    text: 'La clave SAT de uno de los conceptos no existe en el catálogo. Elige otra en el borrador.',
  },
  CFDI40165: {
    fix: 'invoice',
    text: 'La unidad de uno de los conceptos no existe en el catálogo del SAT. Elige otra en el borrador.',
  },
  CFDI40166: {
    fix: 'invoice',
    text: 'Uno de los conceptos tiene precio en cero. Escribe su precio en el borrador.',
  },
  CFDI40118: {
    fix: 'invoice',
    text: 'El tipo de cambio está fuera del rango que el SAT acepta para ese día. Revísalo en el borrador.',
  },
  CFDI40120: {
    fix: 'invoice',
    text: 'El total es mayor de lo que el SAT acepta sin una clave de confirmación. Revisa los importes del borrador.',
  },

  // Ours: how the XML was built, sealed or dated
  CFDI40101: { fix: 'support', text: OUR_ERROR },
  CFDI40102: { fix: 'support', text: OUR_ERROR },
  CFDI40108: { fix: 'support', text: OUR_ERROR },
  CFDI40119: { fix: 'support', text: OUR_ERROR },
  CFDI40203: { fix: 'support', text: OUR_ERROR },
  CFDI40205: { fix: 'support', text: OUR_ERROR },
  CFDI40211: { fix: 'support', text: OUR_ERROR },
  CFDI40215: { fix: 'support', text: OUR_ERROR },
  CFDI40216: { fix: 'support', text: OUR_ERROR },
  CFDI40221: { fix: 'support', text: OUR_ERROR },
  '301': { fix: 'support', text: OUR_ERROR },
  '302': { fix: 'support', text: OUR_ERROR },
  '401': { fix: 'support', text: OUR_ERROR },

  // SW's own account (its balance of stamps with the SAT), not the user's
  S2000: { fix: 'support', text: PAC_UNAVAILABLE },
}

/** "CFDI40145 - El campo Nombre…" → "CFDI40145"; "305 - La fecha…" → "305". */
function errorCode(raw: string): string | null {
  return raw.match(/^\s*([A-Z]*\d{3,5})\s*-/)?.[1] ?? null
}

/** The message the user reads for a PAC rejection, and where they fix it. */
export function explainStampingError(raw: string): StampingErrorExplanation {
  const code = errorCode(raw)
  const known = code ? EXPLANATIONS[code] : undefined
  if (!known) return { message: raw }
  return { message: `${known.text} (${code})`, fix: known.fix }
}
