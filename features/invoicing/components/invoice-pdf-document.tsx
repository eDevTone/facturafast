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

const emerald = '#059669'
const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  500: '#6b7280',
  700: '#374151',
  900: '#111827',
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: gray[900],
  },
  // Watermark
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    fontSize: 72,
    color: '#e5e7eb',
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-35deg)',
    opacity: 0.4,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: emerald,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: gray[900],
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 8,
    color: gray[500],
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: emerald,
    marginBottom: 4,
  },
  folioText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: gray[900],
    marginBottom: 2,
  },
  dateText: {
    fontSize: 8,
    color: gray[500],
  },
  // Sections
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: emerald,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: gray[900],
  },
  valueBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: gray[900],
  },
  valueMono: {
    fontSize: 9,
    fontFamily: 'Courier',
    color: gray[900],
  },
  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: gray[50],
    borderBottomWidth: 1,
    borderBottomColor: gray[200],
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: gray[100],
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  thDesc: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: gray[500], textTransform: 'uppercase' },
  thQty: { width: 50, fontSize: 7, fontFamily: 'Helvetica-Bold', color: gray[500], textTransform: 'uppercase', textAlign: 'right' },
  thPrice: { width: 80, fontSize: 7, fontFamily: 'Helvetica-Bold', color: gray[500], textTransform: 'uppercase', textAlign: 'right' },
  thAmount: { width: 80, fontSize: 7, fontFamily: 'Helvetica-Bold', color: gray[500], textTransform: 'uppercase', textAlign: 'right' },
  tdDesc: { flex: 1, fontSize: 9 },
  tdDescSub: { fontSize: 7, color: gray[500], fontFamily: 'Courier', marginTop: 2 },
  tdQty: { width: 50, fontSize: 9, fontFamily: 'Courier', textAlign: 'right' },
  tdPrice: { width: 80, fontSize: 9, fontFamily: 'Courier', textAlign: 'right' },
  tdAmount: { width: 80, fontSize: 9, fontFamily: 'Courier-Bold', textAlign: 'right' },
  // Totals
  totalsContainer: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  totalsBox: {
    width: 220,
    borderWidth: 1,
    borderColor: gray[200],
    borderRadius: 4,
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 9,
    color: gray[500],
  },
  totalValue: {
    fontSize: 9,
    fontFamily: 'Courier',
  },
  totalDivider: {
    borderBottomWidth: 1,
    borderBottomColor: gray[200],
    marginVertical: 4,
  },
  totalFinalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: gray[900],
  },
  totalFinalValue: {
    fontSize: 11,
    fontFamily: 'Courier-Bold',
    color: emerald,
  },
  // Fiscal stamp section
  stampSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: emerald,
    paddingTop: 12,
  },
  stampRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  stampQr: {
    width: 100,
    height: 100,
  },
  stampInfo: {
    flex: 1,
  },
  stampLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: emerald,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
    marginTop: 6,
  },
  stampValue: {
    fontSize: 6,
    fontFamily: 'Courier',
    color: gray[700],
    lineHeight: 1.4,
  },
  stampUuid: {
    fontSize: 9,
    fontFamily: 'Courier-Bold',
    color: gray[900],
    marginBottom: 2,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: gray[200],
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: gray[500],
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

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>
              {emisor?.businessName || 'Sin perfil fiscal configurado'}
            </Text>
            {emisor && (
              <>
                <Text style={styles.companyDetail}>RFC: {emisor.rfc}</Text>
                <Text style={styles.companyDetail}>Régimen: {emisor.taxRegime}</Text>
                <Text style={styles.companyDetail}>C.P. {emisor.postalCode}</Text>
                {emisor.fiscalAddress && (
                  <Text style={styles.companyDetail}>{emisor.fiscalAddress}</Text>
                )}
              </>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.folioText}>{folioLabel}</Text>
            <Text style={styles.dateText}>
              Fecha: {new Date(invoice.issuedAt).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Receptor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receptor</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Razón Social</Text>
              <Text style={styles.valueBold}>{invoice.client.businessName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>RFC</Text>
              <Text style={styles.valueMono}>{invoice.client.rfc}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Uso CFDI</Text>
              <Text style={styles.value}>
                {invoice.cfdiUsage} — {labels.cfdiUsages[invoice.cfdiUsage] || invoice.cfdiUsage}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de Pago</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Forma de Pago</Text>
              <Text style={styles.value}>
                {invoice.paymentForm} — {labels.paymentForms[invoice.paymentForm] || invoice.paymentForm}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Método de Pago</Text>
              <Text style={styles.value}>
                {invoice.paymentMethod} — {labels.paymentMethods[invoice.paymentMethod] || invoice.paymentMethod}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Moneda</Text>
              <Text style={styles.value}>{invoice.currency}</Text>
            </View>
          </View>
        </View>

        {/* Concepts table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conceptos</Text>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>Descripción</Text>
            <Text style={styles.thQty}>Cant.</Text>
            <Text style={styles.thPrice}>P. Unitario</Text>
            <Text style={styles.thAmount}>Importe</Text>
          </View>
          {/* Rows */}
          {invoice.items.map(item => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.tdDesc}>
                <Text>{item.description}</Text>
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
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
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
                <Text style={{ ...styles.totalValue, color: '#ef4444' }}>
                  -{formatCurrency(parseFloat(invoice.withholdings))}
                </Text>
              </View>
            )}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(parseFloat(invoice.total))}</Text>
            </View>
          </View>
        </View>

        {/* Fiscal stamp */}
        {isStamped && invoice.uuid && (
          <View style={styles.stampSection}>
            <Text style={styles.sectionTitle}>Sello Digital</Text>
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
