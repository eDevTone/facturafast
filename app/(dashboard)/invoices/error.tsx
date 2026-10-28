'use client'

import { RouteError } from '@shared/components/route-error'

export default function InvoicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError pageTitle="Facturas" what="tus facturas" error={error} reset={reset} />
}
