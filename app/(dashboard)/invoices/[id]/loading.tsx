import { Skeleton } from '@shared/ui/skeleton'

export default function InvoiceDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <div className="mb-8">
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="space-y-6">
        {/* Header: folio + badge + actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-8">

          {/* Emisor section */}
          <section className="space-y-3">
            <div>
              <Skeleton className="h-3 w-14" />
              <div className="mt-1 h-px bg-border/40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Skeleton className="h-2.5 w-20 mb-1.5" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
              <div>
                <Skeleton className="h-2.5 w-8 mb-1.5" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div>
                <Skeleton className="h-2.5 w-24 mb-1.5" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div>
                <Skeleton className="h-2.5 w-28 mb-1.5" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </section>

          {/* Receptor section */}
          <section className="space-y-3">
            <div>
              <Skeleton className="h-3 w-16" />
              <div className="mt-1 h-px bg-border/40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-2.5 w-20 mb-1.5" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          </section>

          {/* Datos de Pago section */}
          <section className="space-y-3">
            <div>
              <Skeleton className="h-3 w-24" />
              <div className="mt-1 h-px bg-border/40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-2.5 w-20 mb-1.5" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </section>

          {/* Conceptos section */}
          <section className="space-y-3">
            <div>
              <Skeleton className="h-3 w-20" />
              <div className="mt-1 h-px bg-border/40" />
            </div>

            <div className="rounded-lg border border-border/40 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_120px_120px] gap-4 px-5 py-2.5 border-b border-border/40">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-2.5 w-10 ml-auto" />
                <Skeleton className="h-2.5 w-16 ml-auto" />
                <Skeleton className="h-2.5 w-14 ml-auto" />
              </div>

              {/* Rows */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_120px_120px] gap-4 px-5 py-3 border-b border-border/20 last:border-b-0"
                >
                  <div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-1 h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-8 ml-auto" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
              ))}
            </div>
          </section>

          {/* Totales section */}
          <section>
            <div className="ml-auto max-w-xs space-y-1.5 rounded-xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="h-px bg-border/40 my-1" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-3 w-full mt-2" />
            </div>
          </section>

          {/* Timbre Fiscal Digital section */}
          <section className="space-y-3">
            <div>
              <Skeleton className="h-3 w-36" />
              <div className="mt-1 h-px bg-border/40" />
            </div>
            <div className="flex gap-5">
              <Skeleton className="h-[120px] w-[120px] shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-2.5 w-24 mb-1.5" />
                      <Skeleton className="h-3.5 w-full" />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </div>
          </section>

        </div>{/* end content card */}
      </div>
    </div>
  )
}
