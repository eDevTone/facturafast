import { Skeleton } from '@shared/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="hoja overflow-hidden">
        <div className="border-b border-renglon px-6 py-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid gap-6 px-6 py-5 sm:grid-cols-[1.2fr_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
      </div>
      <div className="hoja divide-y divide-renglon">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
