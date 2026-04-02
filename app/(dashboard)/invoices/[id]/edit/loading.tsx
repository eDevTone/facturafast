import { Skeleton } from '@shared/ui/skeleton'

export default function InvoiceEditLoading() {
  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Skeleton className="h-4 w-20 mb-4" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">
        {/* Issuer & Client selects */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>

        {/* Invoice fields */}
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Line items */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  )
}
