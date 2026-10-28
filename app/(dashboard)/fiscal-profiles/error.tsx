'use client'

import { RouteError } from '@shared/components/route-error'

export default function FiscalProfilesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <RouteError pageTitle="Perfiles fiscales" what="tus perfiles fiscales" error={error} reset={reset} />
}
