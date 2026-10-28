'use client'

import { RouteError } from '@shared/components/route-error'

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError pageTitle="Timbres" what="tu saldo de timbres" error={error} reset={reset} />
}
