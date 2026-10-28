import { Skeleton } from '@shared/ui/skeleton'

export default function BillingLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-10" aria-busy="true" aria-label="Cargando timbres">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-60" />
      </div>

      <div className="flex items-center gap-6">
        <Skeleton className="h-32 w-44" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="hoja space-y-4 p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <div className="space-y-2 border-t border-renglon pt-3">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
