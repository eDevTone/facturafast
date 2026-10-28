import speiInstitutions from '../data/spei-institutions.json'

/**
 * CLABE: the 18-digit interbank account number. Bank (3), plaza (3), account (11) and a check
 * digit: the first 17 digits are weighted 3, 7, 1, 3, 7, 1…, each product is taken modulo 10,
 * and the check digit is (10 − sum mod 10) mod 10.
 */
const WEIGHTS = [3, 7, 1]

/** Only the digits of what the user typed or pasted ("012 180 0012…"). */
export function normalizeClabe(input: string): string {
  return input.replace(/\D/g, '')
}

function checkDigit(first17: string): number {
  const sum = [...first17].reduce((total, digit, index) => total + ((Number(digit) * WEIGHTS[index % 3]) % 10), 0)
  return (10 - (sum % 10)) % 10
}

/** 18 digits with the right check digit. */
export function isValidClabe(clabe: string): boolean {
  return /^\d{18}$/.test(clabe) && checkDigit(clabe.slice(0, 17)) === Number(clabe[17])
}

/**
 * Institution of a CLABE: its first 3 digits are the last 3 of the institution's SPEI code
 * (40012 → 012, BBVA MEXICO). From Banxico's list of SPEI participants (CEP, 2026-10-20).
 */
export function clabeBank(clabe: string): string | null {
  if (!/^\d{3}/.test(clabe)) return null
  return (speiInstitutions as Record<string, string>)[clabe.slice(0, 3)] ?? null
}

/** "012 180 00123456789 0": bank, plaza, account and check digit, easier to read and dictate. */
export function formatClabe(clabe: string): string {
  return /^\d{18}$/.test(clabe) ? `${clabe.slice(0, 3)} ${clabe.slice(3, 6)} ${clabe.slice(6, 17)} ${clabe.slice(17)}` : clabe
}
