'use client'

import { RouteError } from '@shared/components/route-error'

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError pageTitle="Clientes" what="tus clientes" error={error} reset={reset} />
}
