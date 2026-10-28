import { Skeleton } from '@shared/ui/skeleton'

export default function CatalogLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando tus servicios">
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-7 w-36" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <Skeleton className="h-9 w-full max-w-sm" />

      <div className="hoja divide-y divide-renglon">
        <div className="hidden px-5 py-3 md:block">
          <Skeleton className="h-3 w-1/2" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-56 max-w-full" />
              <Skeleton className="mt-1.5 h-3 w-28 md:hidden" />
            </div>
            <Skeleton className="hidden h-4 w-40 md:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
