import { Skeleton } from '@shared/ui/skeleton'

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="hoja divide-y divide-renglon">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="hidden h-5 w-16 md:block" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
