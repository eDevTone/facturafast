import type { SatCfdiStatus } from '../services/sat-status.service'
import { formatCfdiDate } from './cfdi-xml'

/** Pattern of a folio fiscal (UUID), as the CFDI schema writes it. */
export const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i

/** A request whose answer is still unknown: what the cancellation decision needs to know. */
export interface PendingCancellation {
  requestedAt: Date | null
}

/**
 * A rejection seen right after a new request is the SAT still showing the previous one: the
 * receptor cannot answer that fast. Within this window it is ignored.
 */
const REJECTION_GRACE_MS = 5 * 60 * 1000

export type CancellationDecision = 'cancelled' | 'rejected' | 'unchanged'

/**
 * What a SAT answer means for a CFDI. `Estado` decides: "Plazo vencido" is a cancellation when the
 * receptor did not answer a first request, but the CFDI stays valid when it had rejected an earlier
 * one (preguntas frecuentes de cancelación 2026, 14 y 15).
 */
export function decideCancellation(
  answer: SatCfdiStatus,
  pending: PendingCancellation | null,
  now = new Date(),
): CancellationDecision {
  if (answer.state === 'cancelado') return 'cancelled'
  if (!pending || answer.state !== 'vigente') return 'unchanged'
  const ended = answer.cancellationStatus === 'Solicitud rechazada' || answer.cancellationStatus === 'Plazo vencido'
  const fresh = !!pending.requestedAt && now.getTime() - pending.requestedAt.getTime() < REJECTION_GRACE_MS
  return ended && !fresh ? 'rejected' : 'unchanged'
}

/** Columns that keep the last SAT answer. "No encontrado" keeps the previous ones. */
export function satAnswerColumns(answer: SatCfdiStatus, now: Date) {
  return answer.state === 'no_encontrado'
    ? { satCheckedAt: now }
    : { satCancellable: answer.cancellable, satCancellationStatus: answer.cancellationStatus, satCheckedAt: now }
}

/**
 * Last day to cancel a CFDI, YYYY-MM-DD: the month of the annual return of the year it was issued
 * (CFF, art. 29-A). April of the next year for personas físicas (RFC of 13 characters), March for
 * personas morales (12).
 */
export function cancellationDeadline(issuedAt: Date, issuerRfc: string): string {
  const year = Number(formatCfdiDate(issuedAt).slice(0, 4)) + 1
  return issuerRfc.length === 12 ? `${year}-03-31` : `${year}-04-30`
}
