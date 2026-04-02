import { Skeleton } from '@shared/ui/skeleton'

export default function FiscalProfilesLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* "Nuevo RFC" button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Profile cards grid — matches sm:grid-cols-2 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-5"
          >
            {/* Top: icon + RFC + CSD badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1.5 h-3.5 w-44" />
                  <Skeleton className="mt-1.5 h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 shrink-0 rounded-md" />
            </div>

            {/* Actions row */}
            <div className="mt-4 flex items-center gap-1.5 pt-3 border-t border-border/40">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
