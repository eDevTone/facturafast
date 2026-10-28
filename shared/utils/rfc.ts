/** Who a RFC belongs to: 12 characters for a company (persona moral), 13 for a person (persona física). */
export function personTypeOfRfc(rfc: string | null | undefined): 'moral' | 'fisica' | null {
  const length = rfc?.trim().length
  return length === 12 ? 'moral' : length === 13 ? 'fisica' : null
}

/**
 * Whether a régimen fits the kind of person a RFC belongs to. The SAT rejects the stamp when it
 * does not (a persona física with 601, say). An incomplete RFC fits any régimen until it is typed.
 */
export function regimeFitsRfc(
  regime: { applicableToMoral: boolean; applicableToFisica: boolean },
  rfc: string | null | undefined,
): boolean {
  const type = personTypeOfRfc(rfc)
  return type === null || (type === 'moral' ? regime.applicableToMoral : regime.applicableToFisica)
}
