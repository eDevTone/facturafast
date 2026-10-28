'use client'

import { RouteError } from '@shared/components/route-error'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError what="esta sección" error={error} reset={reset} />
}
