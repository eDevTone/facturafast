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
        <p className="text-[11px] text-muted-foreground/60 mb-0.5">{label}</p>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-0.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
        >
          {expanded ? (
            <>Ocultar <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Ver completo <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      </div>
      <p
        className={`text-[11px] font-mono text-muted-foreground/60 leading-relaxed ${
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
    <section className="space-y-3">
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Timbre Fiscal Digital
        </h2>
        <div className="mt-1 h-px bg-border/40" />
      </div>

      <div className="flex gap-5">
        {/* QR Code */}
        {invoice.qrCode && (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${invoice.qrCode}`}
              alt="Código QR de verificación fiscal"
              width={120}
              height={120}
              className="rounded-lg border border-border/40"
            />
          </div>
        )}

        {/* Stamp data */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {invoice.uuid && (
              <div>
                <p className="text-[11px] text-muted-foreground/60 mb-0.5">UUID Fiscal</p>
                <p className="text-[12px] font-mono tracking-wide text-foreground break-all">
                  {invoice.uuid}
                </p>
              </div>
            )}
            {invoice.stampedAt && (
              <div>
                <p className="text-[11px] text-muted-foreground/60 mb-0.5">Fecha de Timbrado</p>
                <p className="text-[12px] text-foreground">{formatDateLong(invoice.stampedAt)}</p>
              </div>
            )}
            {invoice.satCertificateNumber && (
              <div>
                <p className="text-[11px] text-muted-foreground/60 mb-0.5">No. Certificado SAT</p>
                <p className="text-[12px] font-mono tracking-wide text-foreground">
                  {invoice.satCertificateNumber}
                </p>
              </div>
            )}
            {emisor?.certSerialNumber && (
              <div>
                <p className="text-[11px] text-muted-foreground/60 mb-0.5">No. Certificado Emisor</p>
                <p className="text-[12px] font-mono tracking-wide text-foreground">
                  {emisor.certSerialNumber}
                </p>
              </div>
            )}
          </div>

          {/* Sellos colapsables */}
          <div className="space-y-2">
            {invoice.cfdiSignature && (
              <TruncatedSeal label="Sello Digital del CFDI" value={invoice.cfdiSignature} />
            )}
            {invoice.satSignature && (
              <TruncatedSeal label="Sello del SAT" value={invoice.satSignature} />
            )}
            {invoice.satOriginalChain && (
              <TruncatedSeal label="Cadena Original del Timbre" value={invoice.satOriginalChain} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
