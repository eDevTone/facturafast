import { numberToSpanishWords } from '@features/invoicing/utils/number-to-words'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { PaymentCfdi, PaymentCfdiTax } from '../utils/payment-cfdi'
import { formatDay } from '../utils/payment-dates'

interface PaymentPdfDocumentProps {
  cfdi: PaymentCfdi
  /** QR of the SAT verification URL (base64 PNG), as SW returns it. */
  qrCode: string | null
  /** Cadena original del complemento de certificación digital del SAT. */
  satOriginalChain: string | null
  logoUrl?: string | null
  labels: {
    paymentForms: Record<string, string>
    taxRegimes: Record<string, string>
    /** c_Pais, for the ResidenciaFiscal of a receptor abroad. */
    countries?: Record<string, string>
  }
}

// Same print palette as the invoice PDF: black for legibility, red folio, stamp blue.
const palette = {
  text: '#111111',
  label: '#3a3a3a',
  cardBg: '#f4f4f5',
  border: '#d4d4d8',
  white: '#ffffff',
  folio: '#b8382a',
  sello: '#2f4ba8',
}

const TAX_NAMES: Record<string, string> = { '001': 'ISR', '002': 'IVA', '003': 'IEPS' }

const styles = StyleSheet.create({
  page: { padding: 36, paddingBottom: 44, fontSize: 9, fontFamily: 'Helvetica', color: palette.text, backgroundColor: palette.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  companyDetail: { fontSize: 9, color: palette.label, marginBottom: 1 },
  logo: { width: 52, height: 52 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  card: { flex: 1, backgroundColor: palette.cardBg, borderRadius: 8, padding: 10 },
  cardWhite: { flex: 1, backgroundColor: palette.white, borderRadius: 8, padding: 10, borderWidth: 0.6, borderColor: palette.border },
  label: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: palette.label, marginBottom: 3 },
  value: { fontSize: 9 },
  valueBold: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  muted: { fontSize: 8, color: palette.label, marginTop: 2 },
  mono: { fontFamily: 'Courier' },
  amountLarge: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.3, marginBottom: 5 },
  section: { backgroundColor: palette.cardBg, borderRadius: 8, padding: 10, marginBottom: 8 },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: palette.label },
  tr: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: palette.border },
  td: { fontSize: 8.5 },
  tdMono: { fontSize: 8.5, fontFamily: 'Courier' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', width: 220, marginBottom: 2 },
  stampSection: { marginTop: 6, borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 9 },
  stampRow: { flexDirection: 'row', gap: 10 },
  stampQr: { width: 84, height: 84 },
  stampLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 1, marginTop: 3 },
  stampValue: { fontSize: 5.8, fontFamily: 'Courier', color: '#2a2a2a', lineHeight: 1.3 },
  stampUuid: { fontSize: 8.5, fontFamily: 'Courier-Bold', marginBottom: 2 },
  sello: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: palette.sello,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    transform: 'rotate(-3deg)',
    alignItems: 'center',
  },
  selloTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1, color: palette.sello },
  selloLine: { fontSize: 7, fontFamily: 'Courier', color: palette.sello },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: palette.border,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: palette.label },
})

/** "$1,000.00" in pesos; "USD 1,000.00" in another currency. */
function money(value: string | number | null | undefined, currency = 'MXN'): string {
  const amount = Number(value ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency === 'MXN' ? `$${amount}` : `${currency} ${amount}`
}

/** Courier at 5.8pt fits about 128 characters in the stamp column (446pt); break before the PDF wraps. */
const SEAL_LINE = 124

function breakSeal(value: string): string {
  const chunks: string[] = []
  for (let i = 0; i < value.length; i += SEAL_LINE) chunks.push(value.substring(i, i + SEAL_LINE))
  return chunks.join('\n')
}

/** "2026-10-19T13:29:58" (Mexico City time, as written in the CFDI) → "19 oct 2026 13:29:58". */
function cfdiDateTime(value: string): string {
  return `${formatDay(value.slice(0, 10))} ${value.slice(11, 19)}`
}

function taxLabel(tax: PaymentCfdiTax): string {
  const name = TAX_NAMES[tax.tax] ?? tax.tax
  return `${tax.kind === 'retencion' ? 'Retención' : 'Traslado'} ${name} (${tax.tax})`
}

/** Totales attributes in the order of the SAT standard, with readable names. */
const TOTALS_LABELS: [string, string][] = [
  ['TotalRetencionesISR', 'Total retenciones ISR'],
  ['TotalRetencionesIVA', 'Total retenciones IVA'],
  ['TotalRetencionesIEPS', 'Total retenciones IEPS'],
  ['TotalTrasladosBaseIVA16', 'Base IVA 16 %'],
  ['TotalTrasladosImpuestoIVA16', 'IVA 16 %'],
  ['TotalTrasladosBaseIVA8', 'Base IVA 8 %'],
  ['TotalTrasladosImpuestoIVA8', 'IVA 8 %'],
  ['TotalTrasladosBaseIVA0', 'Base IVA 0 %'],
  ['TotalTrasladosImpuestoIVA0', 'IVA 0 %'],
  ['TotalTrasladosBaseIVAExento', 'Base IVA exento'],
]

/** Printed representation of a complemento de pago (CFDI tipo P), read from its stamped XML. */
export function PaymentPdfDocument({ cfdi, qrCode, satOriginalChain, logoUrl, labels }: PaymentPdfDocumentProps) {
  const folioLabel = `${cfdi.serie ? `${cfdi.serie}-` : ''}${cfdi.folio ?? ''}`
  const total = cfdi.totals.MontoTotalPagos
  // One payment per complemento for now; its documents are listed below.
  const payment = cfdi.payments[0]

  return (
    <Document title={`Complemento de pago ${folioLabel}`} author={cfdi.emisor.name}>
      <Page size="LETTER" style={styles.page}>
        {/* Emisor */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{cfdi.emisor.name}</Text>
            <Text style={styles.companyDetail}>RFC: {cfdi.emisor.rfc}</Text>
            <Text style={styles.companyDetail}>
              Régimen fiscal: {cfdi.emisor.taxRegime} — {labels.taxRegimes[cfdi.emisor.taxRegime] ?? cfdi.emisor.taxRegime}
            </Text>
            <Text style={styles.companyDetail}>Lugar de expedición: C.P. {cfdi.postalCode}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          {logoUrl && <Image style={styles.logo} src={logoUrl} />}
        </View>

        {/* Receptor | Pago | Folio */}
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.label}>Recibimos el pago de:</Text>
            <Text style={styles.valueBold}>{cfdi.receptor.name}</Text>
            <Text style={{ ...styles.value, marginTop: 4 }}>RFC: {cfdi.receptor.rfc}</Text>
            {cfdi.receptor.country ? (
              <Text style={styles.muted}>
                Residencia fiscal: {cfdi.receptor.country} — {labels.countries?.[cfdi.receptor.country] || cfdi.receptor.country}
                {cfdi.receptor.foreignTaxId ? ` · Núm. de registro: ${cfdi.receptor.foreignTaxId}` : ''}
              </Text>
            ) : (
              <Text style={styles.muted}>C.P. {cfdi.receptor.postalCode}</Text>
            )}
            <Text style={styles.muted}>
              Régimen: {cfdi.receptor.taxRegime} — {labels.taxRegimes[cfdi.receptor.taxRegime] ?? cfdi.receptor.taxRegime}
            </Text>
            <Text style={styles.muted}>Uso CFDI: {cfdi.receptor.cfdiUsage} — Pagos</Text>
          </View>
          {payment && (
            <View style={styles.cardWhite}>
              <Text style={styles.label}>Pago recibido:</Text>
              <Text style={styles.amountLarge}>{money(payment.amount, payment.currency)}</Text>
              <Text style={{ fontSize: 6.5, color: palette.label, marginTop: 2 }}>{numberToSpanishWords(Number(payment.amount), payment.currency)}</Text>
              <Text style={{ ...styles.value, marginTop: 5 }}>{cfdiDateTime(payment.paidAt)}</Text>
              <Text style={styles.muted}>
                {payment.paymentForm} — {labels.paymentForms[payment.paymentForm] ?? payment.paymentForm}
              </Text>
              <Text style={styles.muted}>
                {payment.currency} · tipo de cambio {payment.exchangeRate ?? '1'}
                {payment.operationNumber ? ` · operación ${payment.operationNumber}` : ''}
              </Text>
            </View>
          )}
          <View style={{ width: 120, gap: 8 }}>
            <View style={styles.card}>
              <Text style={styles.label}>Complemento de pago:</Text>
              <Text style={{ ...styles.value, fontFamily: 'Courier-Bold', color: palette.folio }}>Nº {folioLabel}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.label}>Emitido:</Text>
              <Text style={styles.value}>{cfdiDateTime(cfdi.issuedAt)}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 7.5, color: palette.label, marginBottom: 10 }}>
          Comprobante P — Pago · Moneda XXX · Exportación 01 · Concepto 84111506 · ACT · Pago · Cantidad 1 · Importe $0.00 ·
          Objeto de impuesto 01
        </Text>

        {cfdi.related.map((relation) => (
          <Text key={relation.relationType} style={{ fontSize: 7.5, color: palette.label, marginTop: -6, marginBottom: 10 }}>
            CFDI relacionado: {relation.relationType === '04' ? '04 — Sustitución de los CFDI previos' : relation.relationType} · UUID{' '}
            {relation.uuids.join(', ')}
          </Text>
        ))}

        {/* Facturas pagadas */}
        {cfdi.payments.flatMap((p) => p.documents).map((document) => (
          <View key={document.uuid} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              Factura pagada{document.serie || document.folio ? ` · Nº ${document.serie ? `${document.serie}-` : ''}${document.folio ?? ''}` : ''}
            </Text>
            <Text style={{ ...styles.tdMono, marginBottom: 6 }}>UUID {document.uuid}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, marginBottom: 6 }}>
              <PaymentField label="Parcialidad" value={document.installment} mono />
              <PaymentField label="Saldo anterior" value={money(document.previousBalance, document.currency)} mono />
              <PaymentField label="Importe pagado" value={money(document.amountPaid, document.currency)} mono />
              <PaymentField label="Saldo insoluto" value={money(document.remainingBalance, document.currency)} mono />
              <PaymentField label="Moneda y equivalencia" value={`${document.currency} · ${document.equivalence ?? '1'}`} />
              <PaymentField label="Objeto de impuesto" value={document.taxObject === '02' ? '02 — Sí objeto de impuesto' : `${document.taxObject} — No objeto de impuesto`} />
            </View>

            {document.taxes.length > 0 && (
              <View>
                <View style={{ ...styles.tr, borderBottomColor: palette.label }}>
                  <Text style={{ ...styles.th, flex: 1 }}>Impuestos de este pago</Text>
                  <Text style={{ ...styles.th, width: 70, textAlign: 'right' }}>Tasa</Text>
                  <Text style={{ ...styles.th, width: 80, textAlign: 'right' }}>Base</Text>
                  <Text style={{ ...styles.th, width: 80, textAlign: 'right' }}>Importe</Text>
                </View>
                {document.taxes.map((tax, index) => (
                  <View key={index} style={styles.tr}>
                    <Text style={{ ...styles.td, flex: 1 }}>{taxLabel(tax)}</Text>
                    <Text style={{ ...styles.tdMono, width: 70, textAlign: 'right' }}>{tax.rate ?? tax.factorType}</Text>
                    <Text style={{ ...styles.tdMono, width: 80, textAlign: 'right' }}>{money(tax.base, document.currency)}</Text>
                    <Text style={{ ...styles.tdMono, width: 80, textAlign: 'right' }}>
                      {tax.amount === null ? '—' : `${tax.kind === 'retencion' ? '-' : ''}${money(tax.amount, document.currency)}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* The stamp beside the totals, as on the invoice sheet */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, paddingHorizontal: 10 }}>
          <View style={{ paddingTop: 6 }}>
            {cfdi.stamp && (
              <View style={styles.sello}>
                <Text style={styles.selloTitle}>TIMBRADO</Text>
                <Text style={styles.selloLine}>
                  {formatDay(cfdi.stamp.stampedAt.slice(0, 10))} · UUID …{cfdi.stamp.uuid.slice(-4)}
                </Text>
              </View>
            )}
          </View>
          <View>
            {TOTALS_LABELS.filter(([attribute]) => cfdi.totals[attribute] !== undefined).map(([attribute, label]) => (
              <View key={attribute} style={styles.totalsRow}>
                <Text style={{ fontSize: 8, color: palette.label }}>{label}</Text>
                <Text style={styles.tdMono}>{money(cfdi.totals[attribute])}</Text>
              </View>
            ))}
            <View style={{ ...styles.totalsRow, borderTopWidth: 0.5, borderTopColor: palette.border, paddingTop: 4, marginTop: 2 }}>
              <Text style={{ fontSize: 8 }}>Monto total de pagos{payment && payment.currency !== 'MXN' ? ' (en pesos)' : ''}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>{money(total)}</Text>
            </View>
          </View>
        </View>

        {/* Timbre fiscal digital */}
        {cfdi.stamp && (
          <View style={styles.stampSection} wrap={false}>
            <Text style={styles.sectionTitle}>Timbre fiscal digital</Text>
            <View style={styles.stampRow}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
              {qrCode && <Image style={styles.stampQr} src={`data:image/png;base64,${qrCode}`} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.stampLabel}>Folio fiscal (UUID)</Text>
                <Text style={styles.stampUuid}>{cfdi.stamp.uuid}</Text>
                <Text style={styles.stampLabel}>Fecha de timbrado</Text>
                <Text style={styles.stampValue}>{cfdiDateTime(cfdi.stamp.stampedAt)}</Text>
                <Text style={styles.stampLabel}>No. certificado SAT</Text>
                <Text style={styles.stampValue}>{cfdi.stamp.satCertificateNumber}</Text>
                <Text style={styles.stampLabel}>No. certificado emisor</Text>
                <Text style={styles.stampValue}>{cfdi.certificateNumber}</Text>
                <Text style={styles.stampLabel}>Sello digital del CFDI</Text>
                <Text style={styles.stampValue}>{breakSeal(cfdi.stamp.cfdiSignature)}</Text>
                <Text style={styles.stampLabel}>Sello del SAT</Text>
                <Text style={styles.stampValue}>{breakSeal(cfdi.stamp.satSignature)}</Text>
                {satOriginalChain && (
                  <>
                    <Text style={styles.stampLabel}>Cadena original del complemento de certificación digital del SAT</Text>
                    <Text style={styles.stampValue}>{breakSeal(satOriginalChain)}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Complemento de pago {folioLabel} · Representación impresa de un CFDI</Text>
          <Text style={styles.footerText}>Generado con FacturaFast</Text>
        </View>
      </Page>
    </Document>
  )
}

function PaymentField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ width: '33%', paddingRight: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={mono ? styles.tdMono : styles.td}>{value}</Text>
    </View>
  )
}
