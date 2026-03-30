'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@shared/ui/button'
import { Download, Eye, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { InvoiceWithRelations } from '../types/invoice.types'
import { InvoicePdfDocument } from './invoice-pdf-document'
import { getInvoiceDownloadUrlAction } from '../actions/get-download-url.action'

interface FiscalProfileData {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  fiscalAddress?: string | null
}

interface InvoicePreviewDialogProps {
  invoice: InvoiceWithRelations
  emisor?: FiscalProfileData | null
  labels: {
    paymentForms: Record<string, string>
    paymentMethods: Record<string, string>
    cfdiUsages: Record<string, string>
  }
}

export function InvoicePreviewDialog({ invoice, emisor, labels }: InvoicePreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isR2Url, setIsR2Url] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const folioLabel = `${invoice.serie ? `${invoice.serie}-` : ''}${invoice.folio}`

  const loadPdf = useCallback(async () => {
    setIsGenerating(true)
    try {
      // If stamped and has R2 PDF, use signed URL
      if (invoice.pdfUrl) {
        const result = await getInvoiceDownloadUrlAction(invoice.pdfUrl)
        if (result.url) {
          setPdfUrl(result.url)
          setIsR2Url(true)
          return
        }
      }

      // Fallback: generate on-the-fly
      const blob = await pdf(
        <InvoicePdfDocument invoice={invoice} emisor={emisor} labels={labels} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setIsR2Url(false)
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setIsGenerating(false)
    }
  }, [invoice, emisor, labels])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      loadPdf()
    } else {
      // Cleanup blob URL only (R2 signed URLs don't need cleanup)
      if (pdfUrl && !isR2Url) {
        URL.revokeObjectURL(pdfUrl)
      }
      setPdfUrl(null)
      setIsR2Url(false)
    }
  }

  const handleDownload = () => {
    if (!pdfUrl) return
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `factura-${folioLabel}.pdf`
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Vista Previa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pr-14 pt-5 pb-3 border-b border-border/40 flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base">
            Vista Previa — {folioLabel}
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!pdfUrl}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Descargar PDF
          </Button>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {invoice.pdfUrl ? 'Cargando PDF...' : 'Generando PDF...'}
                </p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Vista previa factura ${folioLabel}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Error al generar el PDF</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
