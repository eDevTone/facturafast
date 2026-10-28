import { getInvoiceDownloadUrlAction } from '@features/invoicing/actions/get-download-url.action'
import { getPaymentXmlAction } from '../actions/get-payment-xml.action'
import type { InvoicePayment } from '../types/payment.types'

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Downloads the XML of a complemento de pago or opens its PDF in a new tab.
 * Falls back to the XML kept in the database when the stored file is not available.
 */
export async function downloadPaymentFile(
  payment: Pick<InvoicePayment, 'id' | 'serie' | 'folio' | 'xmlUrl' | 'pdfUrl'>,
  type: 'xml' | 'pdf',
): Promise<boolean> {
  const filename = `complemento-pago-${payment.serie}-${payment.folio}.xml`
  const key = type === 'xml' ? payment.xmlUrl : payment.pdfUrl

  if (key) {
    const result = await getInvoiceDownloadUrlAction(key)
    if (result.url) {
      if (type === 'pdf') {
        window.open(result.url, '_blank', 'noopener')
      } else {
        const response = await fetch(result.url)
        saveBlob(await response.blob(), filename)
      }
      return true
    }
  }

  if (type === 'xml') {
    const result = await getPaymentXmlAction(payment.id)
    if (result.xml) {
      saveBlob(new Blob([result.xml], { type: 'application/xml' }), filename)
      return true
    }
  }
  return false
}
