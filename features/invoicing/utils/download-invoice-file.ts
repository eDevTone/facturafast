import { getInvoiceDownloadUrlAction } from '../actions/get-download-url.action'
import type { Invoice } from '../types/invoice.types'

export type InvoiceFileType = 'xml' | 'pdf' | 'acuse'

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Downloads the stamped XML, the PDF (opened in a new tab) or the cancellation acuse.
 * Falls back to the XML kept in the database when the stored file is not available.
 */
export async function downloadInvoiceFile(
  invoice: Pick<Invoice, 'serie' | 'folio' | 'xmlUrl' | 'pdfUrl' | 'cancellationAcuseUrl' | 'xmlContent'>,
  type: InvoiceFileType,
): Promise<boolean> {
  const label = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`
  const key = type === 'xml' ? invoice.xmlUrl : type === 'pdf' ? invoice.pdfUrl : invoice.cancellationAcuseUrl

  if (key) {
    const result = await getInvoiceDownloadUrlAction(key)
    if (result.url) {
      if (type === 'pdf') {
        window.open(result.url, '_blank', 'noopener')
      } else {
        const response = await fetch(result.url)
        saveBlob(await response.blob(), type === 'acuse' ? `acuse-cancelacion-${label}.xml` : `factura-${label}.xml`)
      }
      return true
    }
  }

  if (type === 'xml' && invoice.xmlContent) {
    saveBlob(new Blob([invoice.xmlContent], { type: 'application/xml' }), `factura-${label}.xml`)
    return true
  }
  return false
}
