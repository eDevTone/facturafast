'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="mx-auto max-w-md px-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Error al cargar la página
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No pudimos cargar esta sección. Es posible que haya un problema temporal con el servidor.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/50">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
