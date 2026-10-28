'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { formatDateLong } from '@shared/utils/date'
import type { InvoiceWithRelations } from '../types/invoice.types'

interface TimbreFiscalSectionProps {
  invoice: InvoiceWithRelations
  emisor?: {
    certSerialNumber?: string | null
  } | null
}

function TruncatedSeal({ label, value }: { label: string; value: string }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="mb-0.5 text-[12px] text-tinta-tenue">{label}</p>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="flex shrink-0 items-center gap-0.5 text-[12px] text-tinta-tenue transition-colors hover:text-tinta"
        >
          {expanded ? (
            <>Ocultar <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Ver completo <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      </div>
      <p
        className={`font-mono text-[11px] leading-relaxed text-tinta-tenue ${
          expanded ? 'break-all whitespace-pre-wrap' : 'truncate'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export function TimbreFiscalSection({ invoice, emisor }: TimbreFiscalSectionProps) {
  return (
    <section className="space-y-3 border-t border-renglon pt-6">
      <h2 className="text-[13px] font-medium text-tinta-tenue">Timbre fiscal digital</h2>

      <div className="flex flex-col gap-5 sm:flex-row">
        {/* QR Code */}
        {invoice.qrCode && (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${invoice.qrCode}`}
              alt="Código QR de verificación fiscal"
              width={120}
              height={120}
              className="rounded-[4px] border border-renglon bg-white p-1"
            />
          </div>
        )}

        {/* Stamp data */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {invoice.uuid && (
              <div>
                <p className="mb-0.5 text-[12px] text-tinta-tenue">Folio fiscal (UUID)</p>
                <p className="font-mono text-[12px] text-tinta break-all">
                  {invoice.uuid}
                </p>
              </div>
            )}
            {invoice.stampedAt && (
              <div>
                <p className="mb-0.5 text-[12px] text-tinta-tenue">Fecha de timbrado</p>
                <p className="text-[12px] text-tinta">{formatDateLong(invoice.stampedAt)}</p>
              </div>
            )}
            {invoice.satCertificateNumber && (
              <div>
                <p className="mb-0.5 text-[12px] text-tinta-tenue">Nº de certificado del SAT</p>
                <p className="font-mono text-[12px] text-tinta">
                  {invoice.satCertificateNumber}
                </p>
              </div>
            )}
            {emisor?.certSerialNumber && (
              <div>
                <p className="mb-0.5 text-[12px] text-tinta-tenue">Nº de certificado del emisor</p>
                <p className="font-mono text-[12px] text-tinta">
                  {emisor.certSerialNumber}
                </p>
              </div>
            )}
          </div>

          {/* Sellos colapsables */}
          <div className="space-y-2">
            {invoice.cfdiSignature && (
              <TruncatedSeal label="Sello digital del CFDI" value={invoice.cfdiSignature} />
            )}
            {invoice.satSignature && (
              <TruncatedSeal label="Sello del SAT" value={invoice.satSignature} />
            )}
            {invoice.satOriginalChain && (
              <TruncatedSeal label="Cadena original del timbre" value={invoice.satOriginalChain} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
