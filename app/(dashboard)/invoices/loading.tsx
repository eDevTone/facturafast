import { Skeleton } from '@shared/ui/skeleton'

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-4 w-52" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Search bar */}
      <Skeleton className="h-10 w-full max-w-sm rounded-lg" />

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card">
        {/* Table header */}
        <div className="hidden md:grid md:grid-cols-6 items-center gap-3 px-5 py-3 border-b border-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {/* Table rows */}
        <div className="divide-y divide-border/40">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="hidden md:block h-4 w-24" />
                <Skeleton className="hidden md:block h-4 w-20" />
                <Skeleton className="hidden md:block h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
