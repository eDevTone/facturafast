import { Skeleton } from '@shared/ui/skeleton'

export default function BillingLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="mb-8">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Current plan card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
      </div>

      {/* Plan cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-5 space-y-4"
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-5/6" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
