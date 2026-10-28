import { Skeleton } from '@shared/ui/skeleton'

/** Placeholder shaped like the invoice sheet: header band, parties, concepts and totals. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-56" />
      <div className="hoja overflow-hidden">
        <div className="flex justify-between gap-6 border-b border-renglon px-8 py-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-2">
            <Skeleton className="ml-auto h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>
        <div className="space-y-6 px-8 py-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="ml-auto h-24 w-full max-w-xs" />
        </div>
      </div>
    </div>
  )
}
