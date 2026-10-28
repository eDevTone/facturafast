/**
 * The one place where the amounts of a complemento de pago (Pagos 2.0) are computed.
 *
 * The XML builder, the "Registrar cobro" dialog and the service call these functions, so the
 * balance the user sees is the one that gets stamped. Rules (Guía de llenado del complemento de
 * pagos, rev. 16-01-2026; Estándar Pagos 2.0 rev. B):
 * - The first payment starts from the invoice Total; ImpSaldoInsoluto = ImpSaldoAnt − ImpPagado ≥ 0.
 * - The payment covers the invoice taxes in proportion (RMF 2026, regla 2.7.1.32). The SAT does
 *   not publish the formula; this is the usual one:
 *     BaseDR = round2(invoice base × ImpPagado / invoice Total)
 *     ImporteDR = round2(BaseDR × TasaOCuota)
 *   With 2 decimals, ImporteDR always falls inside the tolerance the PAC checks (CRP20254, CRP20261).
 * - ImpuestosP adds up the documents' taxes: one RetencionP per tax, one TrasladoP per tax, factor
 *   type and rate. Totales adds up the ImpuestosP of every payment.
 *
 * Payments are in MXN only for now, so TipoCambioP and EquivalenciaDR are 1.
 */

import { round2 } from '@features/invoicing/utils/cfdi-amounts'

/** c_Impuesto: 001 ISR, 002 IVA, 003 IEPS. */
export type TaxCode = '001' | '002' | '003'
export type FactorType = 'Tasa' | 'Cuota' | 'Exento'
export type TaxKind = 'retencion' | 'traslado'

/** A tax of the invoice, summed over its concepts per kind, tax, factor type and rate. */
export interface InvoiceTaxLine {
  kind: TaxKind
  tax: TaxCode
  factorType: FactorType
  /** TasaOCuota as written in the invoice XML (e.g. "0.160000"); null when Exento. */
  rate: string | null
  base: number
  /** Importe; null when Exento. */
  amount: number | null
}

/** A RetencionDR or TrasladoDR. */
export interface DocumentTax {
  kind: TaxKind
  tax: TaxCode
  factorType: FactorType
  rate: string | null
  /** BaseDR */
  base: number
  /** ImporteDR; null when Exento. */
  amount: number | null
}

/** The amounts of one DoctoRelacionado. */
export interface PaymentDocumentAmounts {
  /** NumParcialidad */
  installment: number
  /** ImpSaldoAnt */
  previousBalance: number
  /** ImpPagado */
  amountPaid: number
  /** ImpSaldoInsoluto */
  remainingBalance: number
  /** ObjetoImpDR: "02" when the invoice has taxes, "01" when it has none. */
  taxObject: '01' | '02'
  /** Retenciones first, then traslados, in the order Pagos20.xsd expects. */
  taxes: DocumentTax[]
}

/** ImpuestosP of one payment. */
export interface PaymentTaxes {
  /** RetencionP: one per tax. */
  retentions: { tax: TaxCode; amount: number }[]
  /** TrasladoP: one per tax, factor type and rate. */
  transfers: { tax: TaxCode; factorType: FactorType; rate: string | null; base: number; amount: number | null }[]
}

/** pago20:Totales. Only the totals of taxes that appear in the payments are set. */
export interface PaymentTotals {
  totalRetencionesIVA?: number
  totalRetencionesISR?: number
  totalRetencionesIEPS?: number
  totalTrasladosBaseIVA16?: number
  totalTrasladosImpuestoIVA16?: number
  totalTrasladosBaseIVA8?: number
  totalTrasladosImpuestoIVA8?: number
  totalTrasladosBaseIVA0?: number
  totalTrasladosImpuestoIVA0?: number
  totalTrasladosBaseIVAExento?: number
  /** MontoTotalPagos */
  montoTotalPagos: number
}

function sum2(values: number[]): number {
  return round2(values.reduce((acc, value) => acc + value, 0))
}

function readAttribute(attributes: string, name: string): string | null {
  return attributes.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null
}

/**
 * Concept taxes of a stamped invoice, summed per kind, tax, factor type and rate.
 * These are the taxes a complemento de pago spreads over the payments.
 */
export function readInvoiceTaxLines(xml: string): InvoiceTaxLine[] {
  const start = xml.indexOf('<cfdi:Conceptos')
  const end = xml.indexOf('</cfdi:Conceptos>')
  if (start === -1 || end === -1) return []

  const lines = new Map<string, InvoiceTaxLine>()
  // `\b` keeps <cfdi:Traslados> and <cfdi:Retenciones> out.
  for (const match of xml.slice(start, end).matchAll(/<cfdi:(Traslado|Retencion)\b([^>]*)>/g)) {
    const kind: TaxKind = match[1] === 'Traslado' ? 'traslado' : 'retencion'
    const attributes = match[2]
    const tax = readAttribute(attributes, 'Impuesto') as TaxCode | null
    const factorType = readAttribute(attributes, 'TipoFactor') as FactorType | null
    if (!tax || !factorType) continue
    const rate = factorType === 'Exento' ? null : readAttribute(attributes, 'TasaOCuota')
    const key = [kind, tax, factorType, rate].join('|')

    const line = lines.get(key) ?? { kind, tax, factorType, rate, base: 0, amount: factorType === 'Exento' ? null : 0 }
    line.base = round2(line.base + Number(readAttribute(attributes, 'Base') ?? 0))
    if (line.amount !== null) line.amount = round2(line.amount + Number(readAttribute(attributes, 'Importe') ?? 0))
    lines.set(key, line)
  }
  return [...lines.values()]
}

/**
 * Where an invoice stands before a new payment, given what its previous payments covered
 * (stamped or being stamped). NumParcialidad counts them; the first payment starts from the Total.
 */
export function invoiceBalance(invoiceTotal: number, previousAmountsPaid: number[]) {
  return {
    installment: previousAmountsPaid.length + 1,
    previousBalance: round2(invoiceTotal - sum2(previousAmountsPaid)),
  }
}

/** A payment as the balance needs it; `relatedUuid` is the complemento it replaces. */
interface BalancePayment {
  amountPaid: string | number
  status: 'en_timbrado' | 'timbrado' | 'cancelado'
  uuid?: string | null
  relatedUuid?: string | null
}

/**
 * The payments that take an invoice balance: not cancelled, and not replaced by a correction that
 * is stamped or being stamped. A replaced complemento stops counting from that moment, even while
 * the SAT has not cancelled it yet.
 */
export function countingPayments<T extends BalancePayment>(invoicePayments: T[]): T[] {
  const replaced = new Set(
    invoicePayments
      .filter((payment) => payment.status !== 'cancelado' && payment.relatedUuid)
      .map((payment) => payment.relatedUuid!.toLowerCase()),
  )
  return invoicePayments.filter((payment) =>
    payment.status !== 'cancelado' && !(payment.uuid && replaced.has(payment.uuid.toLowerCase())))
}

/**
 * Collected and owed amounts of an invoice from its payments. Payments being stamped count:
 * their balance is already taken.
 */
export function summarizeBalance(invoiceTotal: number, invoicePayments: BalancePayment[]) {
  const active = countingPayments(invoicePayments)
  const { installment, previousBalance } = invoiceBalance(invoiceTotal, active.map((payment) => Number(payment.amountPaid)))
  return {
    total: invoiceTotal,
    paid: round2(invoiceTotal - previousBalance),
    balance: previousBalance,
    nextInstallment: installment,
  }
}

/** Retenciones before traslados; within each, by tax code and rate. */
function compareTaxes(a: { kind: TaxKind; tax: TaxCode; rate: string | null }, b: typeof a): number {
  if (a.kind !== b.kind) return a.kind === 'retencion' ? -1 : 1
  if (a.tax !== b.tax) return a.tax < b.tax ? -1 : 1
  return (b.rate ?? '').localeCompare(a.rate ?? '')
}

/** One DoctoRelacionado: balances and the share of the invoice taxes this payment covers. */
export function computePaymentDocument(params: {
  /** Total of the invoice CFDI. */
  invoiceTotal: number
  taxLines: InvoiceTaxLine[]
  installment: number
  previousBalance: number
  amountPaid: number
}): PaymentDocumentAmounts {
  const { invoiceTotal, taxLines, installment, previousBalance } = params
  const amountPaid = round2(params.amountPaid)
  if (!(amountPaid > 0)) throw new Error('El monto del cobro debe ser mayor que cero.')
  if (amountPaid > previousBalance) throw new Error('El monto del cobro no puede ser mayor que el saldo de la factura.')
  if (installment < 1 || installment > 999) throw new Error('Una factura admite de 1 a 999 parcialidades.')

  const factor = amountPaid / invoiceTotal
  const taxes = [...taxLines].sort(compareTaxes).map((line): DocumentTax => {
    const base = round2(line.base * factor)
    // BaseDR must be greater than 0 (Pagos20.xsd). Unreachable while every concept carries IVA.
    if (base <= 0) throw new Error('El monto del cobro es demasiado pequeño para repartir los impuestos de la factura.')
    return {
      kind: line.kind,
      tax: line.tax,
      factorType: line.factorType,
      rate: line.rate,
      base,
      amount: line.factorType === 'Exento' ? null : round2(base * Number(line.rate)),
    }
  })

  return {
    installment,
    previousBalance,
    amountPaid,
    remainingBalance: round2(previousBalance - amountPaid),
    taxObject: taxes.length > 0 ? '02' : '01',
    taxes,
  }
}

/** ImpuestosP of a payment from its documents (EquivalenciaDR = 1). */
export function computePaymentTaxes(documents: PaymentDocumentAmounts[]): PaymentTaxes {
  const taxes = documents.flatMap((document) => document.taxes)

  const retentions = new Map<TaxCode, number[]>()
  const transfers = new Map<string, DocumentTax[]>()
  for (const tax of taxes) {
    if (tax.kind === 'retencion') {
      retentions.set(tax.tax, [...(retentions.get(tax.tax) ?? []), tax.amount ?? 0])
    } else {
      const key = [tax.tax, tax.factorType, tax.rate].join('|')
      transfers.set(key, [...(transfers.get(key) ?? []), tax])
    }
  }

  return {
    retentions: [...retentions.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([tax, amounts]) => ({ tax, amount: sum2(amounts) })),
    transfers: [...transfers.values()]
      .map((group) => ({
        tax: group[0].tax,
        factorType: group[0].factorType,
        rate: group[0].rate,
        base: sum2(group.map((t) => t.base)),
        amount: group[0].amount === null ? null : sum2(group.map((t) => t.amount ?? 0)),
      }))
      .sort((a, b) => compareTaxes({ ...a, kind: 'traslado' }, { ...b, kind: 'traslado' })),
  }
}

const RETENTION_TOTALS: Record<TaxCode, keyof PaymentTotals> = {
  '001': 'totalRetencionesISR',
  '002': 'totalRetencionesIVA',
  '003': 'totalRetencionesIEPS',
}

/** IVA traslado rates that have their own fields in pago20:Totales. */
const IVA_TRANSFER_TOTALS: Record<string, [keyof PaymentTotals, keyof PaymentTotals]> = {
  '0.160000': ['totalTrasladosBaseIVA16', 'totalTrasladosImpuestoIVA16'],
  '0.080000': ['totalTrasladosBaseIVA8', 'totalTrasladosImpuestoIVA8'],
  '0.000000': ['totalTrasladosBaseIVA0', 'totalTrasladosImpuestoIVA0'],
}

/**
 * pago20:Totales, always in pesos: each total is the sum, over the payments of the CFDI, of the
 * value times its TipoCambioP, rounded once at the end (guía de llenado de pagos, p. 27; CRP20211).
 * Payments in MXN have a rate of 1.
 */
export function computePaymentTotals(
  paymentsInCfdi: { amount: number; exchangeRate?: number | null; taxes: PaymentTaxes }[],
): PaymentTotals {
  const raw: Partial<Record<keyof PaymentTotals, number>> = {}
  const add = (field: keyof PaymentTotals, value: number, rate: number) => {
    raw[field] = (raw[field] ?? 0) + value * rate
  }

  for (const { amount, exchangeRate, taxes } of paymentsInCfdi) {
    const rate = exchangeRate ?? 1
    add('montoTotalPagos', amount, rate)
    for (const retention of taxes.retentions) add(RETENTION_TOTALS[retention.tax], retention.amount, rate)
    for (const transfer of taxes.transfers) {
      if (transfer.tax !== '002') continue
      if (transfer.factorType === 'Exento') {
        add('totalTrasladosBaseIVAExento', transfer.base, rate)
        continue
      }
      const fields = transfer.rate ? IVA_TRANSFER_TOTALS[transfer.rate] : undefined
      if (!fields) continue
      add(fields[0], transfer.base, rate)
      add(fields[1], transfer.amount ?? 0, rate)
    }
  }

  const totals: PaymentTotals = { montoTotalPagos: round2(raw.montoTotalPagos ?? 0) }
  for (const [field, value] of Object.entries(raw) as [keyof PaymentTotals, number][]) totals[field] = round2(value)
  return totals
}
