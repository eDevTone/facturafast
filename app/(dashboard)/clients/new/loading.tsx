import { Skeleton } from '@shared/ui/skeleton'

export default function NewClientLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy="true" aria-label="Cargando formulario">
      <div>
        <Skeleton className="mb-4 h-4 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>

      <Skeleton className="h-[72px] w-full" />

      <div className="hoja space-y-8 p-5 sm:p-6">
        {[3, 2, 1].map((fields, section) => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-4 w-28" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  )
}
