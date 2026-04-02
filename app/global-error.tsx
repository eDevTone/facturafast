'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-background font-sans antialiased">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Algo salió mal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ocurrió un error inesperado. Por favor intenta de nuevo.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-muted-foreground/50">
              Código: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
