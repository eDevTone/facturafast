import { Skeleton } from '@shared/ui/skeleton'

export default function FiscalProfilesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando perfiles fiscales">
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="hoja p-5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
            <div className="mt-4 space-y-2 border-t border-renglon pt-3">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="mt-4 flex gap-2 border-t border-renglon pt-3">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
