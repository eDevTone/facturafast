import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        {/* 404 number — large, muted, monospace */}
        <p className="font-mono text-[120px] font-bold leading-none tracking-tighter text-border/80 select-none sm:text-[160px]">
          404
        </p>

        {/* Icon + message */}
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Página no encontrada
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La página que buscas no existe o fue movida. Verifica la URL o regresa al inicio.
          </p>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
          >
            Ver Facturas
          </Link>
        </div>

        {/* Subtle footer hint */}
        <p className="mt-12 text-[12px] text-muted-foreground/40">
          FacturaFast · Sistema de Facturación CFDI 4.0
        </p>
      </div>
    </div>
  )
}
