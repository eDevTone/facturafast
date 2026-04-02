import { Skeleton } from '@shared/ui/skeleton'

export default function NewClientLoading() {
  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Skeleton className="h-4 w-20 mb-4" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-6">
        {/* CSF upload */}
        <Skeleton className="h-24 w-full rounded-lg border-2 border-dashed border-border/40" />

        {/* Fields */}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-lg" />
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
