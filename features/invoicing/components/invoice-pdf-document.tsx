import {
  Document,
  Image,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer'
import type { InvoiceWithRelations } from '../types/invoice.types'

interface FiscalProfileData {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
  logoUrl?: string | null
}

interface InvoicePdfDocumentProps {
  invoice: InvoiceWithRelations
  emisor?: FiscalProfileData | null
  labels: {
    paymentForms: Record<string, string>
    paymentMethods: Record<string, string>
    cfdiUsages: Record<string, string>
  }
}

// Color palette — neutral blue/gray from Pencil design
const c = {
  dark: '#19213d',
  text: '#19213d',
  label: '#868da6',
  sublabel: '#5d6481',
  cardBg: '#f6f8fc',
  border: '#ebeff6',
  accent: '#2388ff',
  white: '#ffffff',
  watermark: '#e5e7eb',
  destructive: '#ef4444',
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: c.text,
    backgroundColor: c.white,
  },
  // Watermark
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    fontSize: 72,
    color: c.watermark,
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-35deg)',
    opacity: 0.35,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: c.dark,
    marginBottom: 6,
  },
  companyDetail: {
    fontSize: 9,
    color: c.label,
    marginBottom: 1,
  },
  logo: {
    width: 52,
    height: 52,
  },
  // Info cards row
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: c.cardBg,
    borderRadius: 8,
    padding: 12,
  },
  infoCardWhite: {
    flex: 1,
    backgroundColor: c.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 0.6,
    borderColor: c.border,
  },
  infoCardSmall: {
    width: 110,
    backgroundColor: c.cardBg,
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.sublabel,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: c.text,
  },
  infoValueBold: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: c.text,
  },
  infoValueSmall: {
    fontSize: 9,
    color: c.text,
  },
  infoValueMuted: {
    fontSize: 9,
    color: c.label,
  },
  amountLarge: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: c.text,
  },
  amountCurrency: {
    fontSize: 11,
    color: c.text,
    marginTop: 2,
  },
  amountDate: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: c.label,
    marginTop: 6,
  },
  // Concepts section
  conceptsCard: {
    backgroundColor: c.cardBg,
    borderRadius: 12,
    padding: 12,
    paddingTop: 16,
    marginBottom: 16,
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
  },
  thDesc: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.label, letterSpacing: 0.3 },
  thQty: { width: 40, fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.label, textAlign: 'right', letterSpacing: 0.3 },
  thPrice: { width: 70, fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.label, textAlign: 'right', letterSpacing: 0.3 },
  thAmount: { width: 70, fontSize: 7, fontFamily: 'Helvetica-Bold', color: c.label, textAlign: 'right', letterSpacing: 0.3 },
  tdDesc: { flex: 1 },
  tdDescText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.text },
  tdDescSub: { fontSize: 7, color: c.label, fontFamily: 'Courier', marginTop: 2 },
  tdQty: { width: 40, fontSize: 9, fontFamily: 'Courier', textAlign: 'right', color: c.label },
  tdPrice: { width: 70, fontSize: 9, fontFamily: 'Courier', textAlign: 'right', color: c.label },
  tdAmount: { width: 70, fontSize: 9, fontFamily: 'Courier-Bold', textAlign: 'right', color: c.text },
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
    color: c.label,
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: c.text,
  },
  totalDivider: {
    width: 180,
    borderBottomWidth: 0.5,
    borderBottomColor: c.border,
    marginVertical: 4,
  },
  totalFinalLabel: {
    fontSize: 8,
    color: c.text,
  },
  totalFinalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: c.accent,
  },
  // Payment info
  paymentSection: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: c.cardBg,
    borderRadius: 8,
    padding: 10,
  },
  paymentLabel: {
    fontSize: 7,
    color: c.label,
    marginBottom: 2,
  },
  paymentValue: {
    fontSize: 8,
    color: c.text,
  },
  // Fiscal stamp section
  stampSection: {
    marginTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
    paddingTop: 12,
  },
  stampTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: c.sublabel,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stampQr: {
    width: 90,
    height: 90,
  },
  stampInfo: {
    flex: 1,
  },
  stampLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: c.sublabel,
    letterSpacing: 0.3,
    marginBottom: 1,
    marginTop: 5,
  },
  stampValue: {
    fontSize: 5.5,
    fontFamily: 'Courier',
    color: c.label,
    lineHeight: 1.4,
  },
  stampUuid: {
    fontSize: 8,
    fontFamily: 'Courier-Bold',
    color: c.text,
    marginBottom: 2,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 28,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: c.border,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: c.label,
  },
})

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function breakString(str: string, chunkSize: number): string {
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.substring(i, i + chunkSize))
  }
  return chunks.join('\n')
}

export function InvoicePdfDocument({ invoice, emisor, labels }: InvoicePdfDocumentProps) {
  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const isDraft = invoice.status === 'draft'
  const isStamped = invoice.status === 'timbrada' || invoice.status === 'cancelada'

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
              <Text style={styles.companyDetail}>
                RFC: {emisor.rfc}
              </Text>
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
            <Text style={{ ...styles.infoValueMuted, marginTop: 2 }}>
              C.P. {invoice.client.postalCode}
            </Text>
          </View>

          {/* Monto a pagar */}
          <View style={styles.infoCardWhite}>
            <Text style={styles.infoLabel}>Monto a pagar:</Text>
            <Text style={styles.amountLarge}>
              {formatCurrency(parseFloat(invoice.total))}
            </Text>
            <Text style={styles.amountCurrency}>{invoice.currency}</Text>
            <Text style={styles.amountDate}>
              {new Date(invoice.issuedAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Folio + Fecha */}
          <View style={{ width: 110, gap: 8 }}>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoLabel}>Número de factura:</Text>
              <Text style={{ ...styles.infoValueSmall, fontFamily: 'Helvetica-Bold' }}>
                Nº: {folioLabel}
              </Text>
            </View>
            <View style={styles.infoCardSmall}>
              <Text style={styles.infoLabel}>Emitida:</Text>
              <Text style={styles.infoValueSmall}>
                {new Date(invoice.issuedAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
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
        </View>

        {/* Concepts table in card */}
        <View style={styles.conceptsCard}>
          {/* Table header */}
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>Descripción</Text>
            <Text style={styles.thQty}>Cant.</Text>
            <Text style={styles.thPrice}>Precio</Text>
            <Text style={styles.thAmount}>Total</Text>
          </View>

          {/* Rows */}
          {invoice.items.map(item => (
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
                {formatCurrency(parseFloat(item.unitPrice))}
              </Text>
              <Text style={styles.tdAmount}>
                {formatCurrency(parseFloat(item.amount))}
              </Text>
            </View>
          ))}

          {/* Totals inside card */}
          <View style={{ ...styles.totalsContainer, marginTop: 12 }}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(parseFloat(invoice.subtotal))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA 16%</Text>
              <Text style={styles.totalValue}>{formatCurrency(parseFloat(invoice.iva))}</Text>
            </View>
            {parseFloat(invoice.withholdings) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Retenciones</Text>
                <Text style={{ ...styles.totalValue, color: c.destructive }}>
                  -{formatCurrency(parseFloat(invoice.withholdings))}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={{ ...styles.totalRow, alignItems: 'center' }}>
              <Text style={styles.totalFinalLabel}>Monto total:</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(parseFloat(invoice.total))}</Text>
            </View>
          </View>
        </View>

        {/* Fiscal stamp */}
        {isStamped && invoice.uuid && (
          <View style={styles.stampSection}>
            <Text style={styles.stampTitle}>SELLO DIGITAL</Text>
            <View style={styles.stampRow}>
              {invoice.qrCode && (
                <Image
                  style={styles.stampQr}
                  src={`data:image/png;base64,${invoice.qrCode}`}
                />
              )}
              <View style={styles.stampInfo}>
                <Text style={styles.stampLabel}>UUID Fiscal</Text>
                <Text style={styles.stampUuid}>{invoice.uuid}</Text>

                {invoice.stampedAt && (
                  <>
                    <Text style={styles.stampLabel}>Fecha de Timbrado</Text>
                    <Text style={styles.stampValue}>
                      {new Date(invoice.stampedAt).toLocaleString('es-MX')}
                    </Text>
                  </>
                )}

                {invoice.satCertificateNumber && (
                  <>
                    <Text style={styles.stampLabel}>No. Certificado SAT</Text>
                    <Text style={styles.stampValue}>{invoice.satCertificateNumber}</Text>
                  </>
                )}

                {invoice.cfdiSignature && (
                  <>
                    <Text style={styles.stampLabel}>Sello Digital del CFDI</Text>
                    <Text style={styles.stampValue}>{breakString(invoice.cfdiSignature, 120)}</Text>
                  </>
                )}

                {invoice.satSignature && (
                  <>
                    <Text style={styles.stampLabel}>Sello del SAT</Text>
                    <Text style={styles.stampValue}>{breakString(invoice.satSignature, 120)}</Text>
                  </>
                )}

                {invoice.satOriginalChain && (
                  <>
                    <Text style={styles.stampLabel}>Cadena Original del Timbre</Text>
                    <Text style={styles.stampValue}>{breakString(invoice.satOriginalChain, 120)}</Text>
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
