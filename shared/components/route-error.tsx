'use client'

import { RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@shared/ui/button'

interface RouteErrorProps {
  /** Page title kept on screen so the user knows where they are. */
  pageTitle?: string
  /** What could not be loaded, e.g. "tus clientes". */
  what: string
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Shared body for route `error.tsx` files: says what failed, how to retry, and keeps the page title.
 */
export function RouteError({ pageTitle, what, error, reset }: RouteErrorProps) {
  return (
    <div className="space-y-6">
      {pageTitle && (
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{pageTitle}</h1>
      )}

      <div className="hoja border-l-2 border-tinta-roja px-6 py-10 sm:px-10">
        <h2 className="text-base font-semibold text-tinta">No pudimos cargar {what}</h2>
        <p className="mt-1.5 max-w-prose text-sm text-tinta-tenue">
          Se perdió la conexión con el servidor. Tus datos no se modificaron. Vuelve a intentarlo; si sigue
          fallando, escríbenos con el código de abajo.
        </p>
        {error.digest && (
          <p className="mt-3 text-[12px] text-tinta-tenue">
            Código <span className="font-mono text-tinta">{error.digest}</span>
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Volver a intentar
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
