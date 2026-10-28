import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import { paymentDetailLines, type PaymentDetails } from '@features/collections/utils/reminder-message'
import { formatDay } from '@features/payments/utils/payment-dates'
import { formatDateLong, formatDateShort, formatDateTime } from '@shared/utils/date'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { invoiceAmounts } from '../utils/invoice-amounts'
import { numberToSpanishWords } from '../utils/number-to-words'

interface FiscalProfileData {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
  logoUrl?: string | null
  certSerialNumber?: string | null
  /** "Para que te paguen": printed while the invoice is owed. */
  payment?: PaymentDetails | null
}

interface InvoicePdfDocumentProps {
  invoice: InvoiceWithRelations
  emisor?: FiscalProfileData | null
  labels: {
    paymentForms: Record<string, string>
    paymentMethods: Record<string, string>
    cfdiUsages: Record<string, string>
    taxRegimes?: Record<string, string>
    /** c_Pais names, for a client abroad. */
    countries?: Record<string, string>
  }
}

// Color palette — neutral blue/gray from Pencil design
// Palette optimized for B/W printing — high contrast, legible at all sizes
const palette = {
  dark: '#111111',
  text: '#111111',
  label: '#3a3a3a',
  sublabel: '#2a2a2a',
  cardBg: '#f4f4f5',
  border: '#d4d4d8',
  accent: '#111111',      // prints as solid black instead of blue
  white: '#ffffff',
  watermark: '#d4d4d8',
  destructive: '#111111',
  // Talonario signature: folio in pre-printed red, stamp in rubber-stamp blue
  folio: '#b8382a',
  sello: '#2f4ba8',
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 44,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: palette.text,
    backgroundColor: palette.white,
  },
  // Watermark
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    fontSize: 72,
    color: palette.watermark,
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-35deg)',
    opacity: 0.35,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: palette.dark,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: palette.label,
    marginBottom: 1,
  },
  logo: {
    width: 52,
    height: 52,
  },
  // Info cards row
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: palette.cardBg,
    borderRadius: 8,
    padding: 10,
  },
  infoCardWhite: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: 8,
    padding: 10,
    borderWidth: 0.6,
    borderColor: palette.border,
  },
  infoCardSmall: {
    width: 105,
    backgroundColor: palette.cardBg,
    borderRadius: 8,
    padding: 10,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: palette.sublabel,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: palette.text,
  },
  infoValueBold: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: palette.text,
  },
  infoValueSmall: {
    fontSize: 9,
    color: palette.text,
  },
  infoValueMuted: {
    fontSize: 9,
    color: palette.label,
  },
  amountLarge: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: palette.text,
  },
  amountCurrency: {
    fontSize: 11,
    color: palette.text,
    marginTop: 2,
  },
  amountDate: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: palette.label,
    marginTop: 6,
  },
  // Concepts section
  conceptsCard: {
    backgroundColor: palette.cardBg,
    borderRadius: 10,
    padding: 10,
    paddingTop: 12,
    marginBottom: 10,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 6,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
  },
  thDesc: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: palette.label, letterSpacing: 0.3 },
  thQty: { width: 40, fontSize: 7, fontFamily: 'Helvetica-Bold', color: palette.label, textAlign: 'right', letterSpacing: 0.3 },
  thPrice: { width: 70, fontSize: 7, fontFamily: 'Helvetica-Bold', color: palette.label, textAlign: 'right', letterSpacing: 0.3 },
  thAmount: { width: 70, fontSize: 7, fontFamily: 'Helvetica-Bold', color: palette.label, textAlign: 'right', letterSpacing: 0.3 },
  tdDesc: { flex: 1 },
  tdDescText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: palette.text },
  tdDescSub: { fontSize: 7, color: palette.label, fontFamily: 'Courier', marginTop: 2 },
  tdQty: { width: 40, fontSize: 9, fontFamily: 'Courier', textAlign: 'right', color: palette.label },
  tdPrice: { width: 70, fontSize: 9, fontFamily: 'Courier', textAlign: 'right', color: palette.label },
  tdAmount: { width: 70, fontSize: 9, fontFamily: 'Courier-Bold', textAlign: 'right', color: palette.text },
  // Totals
  totalsContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
    paddingRight: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 180,
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 8,
    color: palette.label,
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: palette.text,
  },
  totalDivider: {
    width: 180,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.border,
    marginVertical: 4,
  },
  totalFinalLabel: {
    fontSize: 8,
    color: palette.text,
  },
  totalFinalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: palette.accent,
  },
  // Payment info
  paymentSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: palette.cardBg,
    borderRadius: 8,
    padding: 8,
  },
  paymentLabel: {
    fontSize: 7,
    color: palette.label,
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 8,
    color: palette.text,
  },
  relatedCard: {
    backgroundColor: palette.cardBg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 14,
  },
  payCard: {
    borderWidth: 1,
    borderColor: palette.cardBg,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  // Fiscal stamp section — optimized for B/W printing
  stampSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingTop: 9,
  },
  stampTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stampQr: {
    width: 84,
    height: 84,
  },
  stampInfo: {
    flex: 1,
  },
  stampLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    letterSpacing: 0.3,
    marginBottom: 1,
    marginTop: 4,
  },
  stampValue: {
    fontSize: 5.8,
    fontFamily: 'Courier',
    color: '#2a2a2a',
    lineHeight: 1.35,
  },
  stampUuid: {
    fontSize: 8.5,
    fontFamily: 'Courier-Bold',
    color: '#111111',
    marginBottom: 2,
  },
  // Footer
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
  footerText: {
    fontSize: 7,
    color: palette.label,
  },
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
  selloTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: palette.sello,
  },
  selloLine: {
    fontSize: 7,
    fontFamily: 'Courier',
    color: palette.sello,
  },
})

/** "$1,000.00" in pesos; "USD 1,000.00" in another currency. */
function formatCurrency(value: number, currency = 'MXN'): string {
  const amount = value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency === 'MXN' ? `$${amount}` : `${currency} ${amount}`
}

function breakSeal(str: string): string {
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += 150) {
    chunks.push(str.substring(i, i + 150))
  }
  return chunks.join('\n')
}

export function InvoicePdfDocument({ invoice, emisor, labels }: InvoicePdfDocumentProps) {
  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada' || invoice.status === 'cancelada'
  // Same amounts as the XML (read back from it once stamped)
  const amounts = invoiceAmounts(invoice)
  // A PPD invoice, or a PUE one not paid yet, carries the due date and how to pay it.
  const owed = invoice.status !== 'cancelada' && (invoice.paymentMethod === 'PPD' || invoice.awaitingPayment)
  const payLines = owed ? paymentDetailLines(emisor?.payment ?? null) : []
  const dueLine = owed && invoice.dueDate ? `Vence el ${formatDay(invoice.dueDate)}` : null
  const hasWithholdings = amounts.withholdings > 0

  return (
    <Document title={`Factura ${folioLabel}`} author={emisor?.businessName || 'FacturaFast'}>
      <Page size="LETTER" style={styles.page}>
        {/* Draft watermark */}
        {isDraft && <Text style={styles.watermark}>BORRADOR</Text>}

        {/* Header — Company name + logo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>
              {emisor?.businessName || 'Sin perfil fiscal'}
            </Text>
            {emisor && (
              <>
                <Text style={styles.companyDetail}>
                  RFC: {emisor.rfc}
                </Text>
                <Text style={styles.companyDetail}>
                  Régimen Fiscal: {emisor.taxRegime} — {labels.taxRegimes?.[emisor.taxRegime] || emisor.taxRegime}
                </Text>
                <Text style={styles.companyDetail}>
                  Lugar de Expedición: C.P. {emisor.postalCode}
                </Text>
              </>
            )}
          </View>
          {emisor?.logoUrl && (
            <Image style={styles.logo} src={emisor.logoUrl} />
          )}
        </View>

        {/* Info cards — Receptor | Monto | Folio + Fecha */}
        <View style={styles.infoRow}>
          {/* Receptor */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Facturar a:</Text>
            <Text style={styles.infoValueBold}>{invoice.client.businessName}</Text>
            <Text style={{ ...styles.infoValueSmall, marginTop: 4 }}>
              RFC: {invoice.client.rfc}
            </Text>
            {invoice.client.country ? (
              <Text style={{ ...styles.infoValueMuted, marginTop: 2 }}>
                Residencia fiscal: {invoice.client.country} — {labels.countries?.[invoice.client.country] || invoice.client.country}
                {invoice.client.foreignTaxId ? ` · Núm. de registro: ${invoice.client.foreignTaxId}` : ''}
              </Text>
            ) : (
              <Text style={{ ...styles.infoValueMuted, marginTop: 2 }}>
                C.P. {invoice.client.postalCode}
              </Text>
            )}
            {invoice.client.taxRegime && (
              <Text style={{ ...styles.infoValueMuted, marginTop: 2 }}>
                Régimen: {invoice.client.taxRegime} — {labels.taxRegimes?.[invoice.client.taxRegime] || invoice.client.taxRegime}
              </Text>
            )}
          </View>

          {/* Monto a pagar */}
          <View style={styles.infoCardWhite}>
            <Text style={styles.infoLabel}>Monto a pagar:</Text>
            <Text style={styles.amountLarge}>
              {formatCurrency(amounts.total, invoice.currency)}
            </Text>
            {/* In pesos the amount has no code; in another currency it already starts with it */}
            {invoice.currency === 'MXN' && <Text style={styles.amountCurrency}>MXN</Text>}
            <Text style={styles.amountDate}>
              {formatDateLong(invoice.issuedAt)}
            </Text>
          </View>

          {/* Folio + Fecha */}
          <View style={{ width: 110, gap: 8 }}>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoLabel}>Número de factura:</Text>
              <Text style={{ ...styles.infoValueSmall, fontFamily: 'Courier-Bold', color: palette.folio }}>
                Nº {folioLabel}
              </Text>
            </View>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoLabel}>Emitida:</Text>
              <Text style={styles.infoValueSmall}>
                {formatDateShort(invoice.issuedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment info row */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentLabel}>Forma de pago</Text>
            <Text style={styles.paymentValue}>
              {invoice.paymentForm} — {labels.paymentForms[invoice.paymentForm] || invoice.paymentForm}
            </Text>
          </View>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentLabel}>Método de pago</Text>
            <Text style={styles.paymentValue}>
              {invoice.paymentMethod} — {labels.paymentMethods[invoice.paymentMethod] || invoice.paymentMethod}
            </Text>
          </View>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentLabel}>Uso CFDI</Text>
            <Text style={styles.paymentValue}>
              {invoice.cfdiUsage} — {labels.cfdiUsages[invoice.cfdiUsage] || invoice.cfdiUsage}
            </Text>
          </View>
          {invoice.currency !== 'MXN' && invoice.exchangeRate && (
            <View style={styles.paymentCard}>
              <Text style={styles.paymentLabel}>Tipo de cambio</Text>
              <Text style={styles.paymentValue}>
                {Number(invoice.exchangeRate)} MXN por {invoice.currency}
              </Text>
            </View>
          )}
        </View>

        {/* CfdiRelacionados: the invoice this one replaces */}
        {invoice.relationType && invoice.relatedUuid && (
          <View style={styles.relatedCard}>
            <Text style={styles.paymentLabel}>CFDI relacionado</Text>
            <Text style={styles.paymentValue}>
              {invoice.relationType === '04' ? '04 — Sustitución de los CFDI previos' : invoice.relationType} · UUID {invoice.relatedUuid}
            </Text>
          </View>
        )}

        {/* Concepts table in card */}
        <View style={styles.conceptsCard}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>Descripción</Text>
            <Text style={styles.thQty}>Cant.</Text>
            <Text style={styles.thPrice}>Valor unitario</Text>
            <Text style={styles.thAmount}>Importe</Text>
          </View>

          {/* Rows */}
          {invoice.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.tdDesc}>
                <Text style={styles.tdDescText}>{item.description}</Text>
                <Text style={styles.tdDescSub}>
                  {item.productServiceCode} · {item.unit}
                </Text>
              </View>
              <Text style={styles.tdQty}>
                {parseFloat(item.quantity).toLocaleString('es-MX')}
              </Text>
              <Text style={styles.tdPrice}>
                {formatCurrency(amounts.concepts[index]?.unitValue ?? 0, invoice.currency)}
              </Text>
              <Text style={styles.tdAmount}>
                {formatCurrency(amounts.concepts[index]?.base ?? 0, invoice.currency)}
              </Text>
            </View>
          ))}

          {/* Totals inside card */}
          <View style={{ ...styles.totalsContainer, marginTop: 12 }}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(amounts.subtotal, invoice.currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA {Number(invoice.ivaRate) === 0 ? 0 : 16}%</Text>
              <Text style={styles.totalValue}>{formatCurrency(amounts.iva, invoice.currency)}</Text>
            </View>
            {amounts.isrWithheld > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Retención ISR</Text>
                <Text style={styles.totalValue}>-{formatCurrency(amounts.isrWithheld, invoice.currency)}</Text>
              </View>
            )}
            {amounts.ivaWithheld > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Retención IVA</Text>
                <Text style={styles.totalValue}>-{formatCurrency(amounts.ivaWithheld, invoice.currency)}</Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={{ ...styles.totalRow, alignItems: 'center' }}>
              <Text style={styles.totalFinalLabel}>{hasWithholdings ? 'Neto a recibir:' : 'Monto total:'}</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(amounts.total, invoice.currency)}</Text>
            </View>
            <View style={{ width: 280, marginTop: 6 }}>
              <Text style={{ fontSize: 6.5, color: palette.label, letterSpacing: 0.2 }}>
                {numberToSpanishWords(amounts.total, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Para pagar: only while the invoice is owed (a paid PUE does not ask to be paid again) */}
        {payLines.length + (dueLine ? 1 : 0) > 0 && (
          <View style={styles.payCard} wrap={false}>
            <Text style={styles.paymentLabel}>Para pagar</Text>
            {dueLine && <Text style={{ ...styles.paymentValue, fontFamily: 'Helvetica-Bold' }}>{dueLine}</Text>}
            {payLines.map((line) => (
              <Text key={line} style={styles.paymentValue}>{line}</Text>
            ))}
          </View>
        )}

        {/* Fiscal stamp */}
        {isStamped && invoice.uuid && (
          <View style={styles.stampSection}>
            <View style={{ ...styles.sello, borderColor: invoice.status === 'cancelada' ? palette.folio : palette.sello, marginBottom: 10 }}>
              <Text style={{ ...styles.selloTitle, color: invoice.status === 'cancelada' ? palette.folio : palette.sello }}>
                {invoice.status === 'cancelada' ? 'CANCELADA' : 'TIMBRADA'}
              </Text>
              {invoice.stampedAt && (
                <Text style={{ ...styles.selloLine, color: invoice.status === 'cancelada' ? palette.folio : palette.sello }}>
                  {formatDateShort(invoice.stampedAt)} · UUID …{invoice.uuid.slice(-4)}
                </Text>
              )}
            </View>
            <Text style={styles.stampTitle}>Timbre fiscal digital</Text>
            <View style={styles.stampRow}>
              {invoice.qrCode && (
                <Image
                  style={styles.stampQr}
                  src={`data:image/png;base64,${invoice.qrCode}`}
                />
              )}
              <View style={styles.stampInfo}>
                <Text style={styles.stampLabel}>Folio fiscal (UUID)</Text>
                <Text style={styles.stampUuid}>{invoice.uuid}</Text>

                {invoice.stampedAt && (
                  <>
                    <Text style={styles.stampLabel}>Fecha de Timbrado</Text>
                    <Text style={styles.stampValue}>
                      {formatDateTime(invoice.stampedAt)}
                    </Text>
                  </>
                )}

                {invoice.satCertificateNumber && (
                  <>
                    <Text style={styles.stampLabel}>No. Certificado SAT</Text>
                    <Text style={styles.stampValue}>{invoice.satCertificateNumber}</Text>
                  </>
                )}

                {emisor?.certSerialNumber && (
                  <>
                    <Text style={styles.stampLabel}>No. Certificado Emisor</Text>
                    <Text style={styles.stampValue}>{emisor.certSerialNumber}</Text>
                  </>
                )}

                {invoice.cfdiSignature && (
                  <>
                    <Text style={styles.stampLabel}>Sello Digital del CFDI</Text>
                    <Text style={styles.stampValue}>{breakSeal(invoice.cfdiSignature)}</Text>
                  </>
                )}

                {invoice.satSignature && (
                  <>
                    <Text style={styles.stampLabel}>Sello del SAT</Text>
                    <Text style={styles.stampValue}>{breakSeal(invoice.satSignature)}</Text>
                  </>
                )}

                {invoice.satOriginalChain && (
                  <>
                    <Text style={styles.stampLabel}>Cadena Original del Timbre</Text>
                    <Text style={styles.stampValue}>{breakSeal(invoice.satOriginalChain)}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {isDraft ? 'BORRADOR — Este documento no tiene validez fiscal' : `Factura ${folioLabel}`}
          </Text>
          <Text style={styles.footerText}>Generado con FacturaFast</Text>
        </View>
      </Page>
    </Document>
  )
}
