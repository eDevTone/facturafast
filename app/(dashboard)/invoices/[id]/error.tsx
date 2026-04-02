'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function InvoiceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          ← Facturas
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Error al cargar factura
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-base font-semibold text-foreground">
          No se pudo cargar la factura
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Es posible que la factura no exista o haya un problema temporal.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/50">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            Ver Facturas
          </Link>
        </div>
      </div>
    </div>
  )
}
