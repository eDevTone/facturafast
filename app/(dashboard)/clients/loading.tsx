import { Skeleton } from '@shared/ui/skeleton'

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="divide-y divide-border/40">
          {/* Column headers */}
          <div className="hidden md:grid md:grid-cols-[1fr_130px_80px_160px_160px_72px] items-center gap-3 px-5 py-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <span />
          </div>

          {/* Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[1fr_130px_80px_160px_160px_72px] items-center gap-2 md:gap-3 px-5 py-3"
            >
              {/* Name with avatar */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="mt-1 h-3 w-24 md:hidden" />
                </div>
              </div>
              {/* RFC */}
              <Skeleton className="hidden md:block h-4 w-[110px]" />
              {/* Tipo */}
              <Skeleton className="hidden md:block h-5 w-14 rounded-md" />
              {/* Regimen */}
              <Skeleton className="hidden md:block h-5 w-32 rounded-md" />
              {/* Contact */}
              <Skeleton className="hidden md:block h-3.5 w-36" />
              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border/40 px-5 py-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}
