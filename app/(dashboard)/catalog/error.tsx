'use client'

import { RouteError } from '@shared/components/route-error'

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError pageTitle="Mis servicios" what="tus servicios" error={error} reset={reset} />
}
