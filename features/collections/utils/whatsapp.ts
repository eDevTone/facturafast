/** Countries of the North American plan: 10-digit numbers after the country code 1. */
const NANP_COUNTRIES = new Set(['USA', 'CAN'])

/**
 * The client's number for wa.me: international format, digits only, without "+" or leading
 * zeros. A 10-digit number takes 52 for a client in México (`country` null) and 1 for one in the
 * US or Canada. Null when there is no usable number: wa.me then lets the user pick the chat.
 */
export function whatsappNumber(phone: string | null | undefined, country: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length < 8 || digits.length > 15) return null
  if (digits.length === 10 && !country) return `52${digits}`
  if (digits.length === 10 && NANP_COUNTRIES.has(country ?? '')) return `1${digits}`
  return digits
}

/** WhatsApp's click to chat with the message already typed: https://wa.me/<number>?text=<message>. */
export function whatsappLink(number: string | null, message: string): string {
  return `https://wa.me/${number ?? ''}?text=${encodeURIComponent(message)}`
}
