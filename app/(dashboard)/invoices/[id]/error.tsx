'use client'

import { RouteError } from '@shared/components/route-error'

export default function InvoiceDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError pageTitle="Factura" what="esta factura" error={error} reset={reset} />
}
