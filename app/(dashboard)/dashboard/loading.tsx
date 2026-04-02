import { Skeleton } from '@shared/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Plan usage banner */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-40 flex-1" />
                <Skeleton className="hidden md:block h-4 w-20" />
                <Skeleton className="hidden md:block h-4 w-24" />
                <Skeleton className="hidden md:block h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
