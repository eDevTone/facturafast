'use client'

import { formatDateShort } from '@shared/utils/date'
import { STAMP_PACKAGES } from '../constants/plans'
import type { PurchaseRecord } from '../types/billing.types'

interface PurchaseHistoryProps {
  purchases: PurchaseRecord[]
}

function getPackageName(packageId: string): string {
  const pkg = STAMP_PACKAGES.find(p => p.id === packageId)
  if (pkg) return pkg.name
  if (packageId === 'welcome') return 'Bienvenida'
  return packageId
}

function formatAmount(amountMxn: number): string {
  if (amountMxn === 0) return 'Gratis'
  return `$${(amountMxn / 100).toFixed(2)}`
}

export function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-4">
        Historial de compras
      </p>

      {purchases.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes compras registradas.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_80px_100px] items-center gap-3 px-5 py-2.5 border-b border-border/40">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              Fecha
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              Paquete
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 text-right">
              Timbres
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/40 text-right">
              Monto
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/40">
            {purchases.map(purchase => (
              <div
                key={purchase.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_100px] items-center gap-1 sm:gap-3 px-5 py-3"
              >
                <span className="text-[13px] text-muted-foreground tabular-nums">
                  {formatDateShort(purchase.createdAt)}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {getPackageName(purchase.packageId)}
                </span>
                <span className="text-[13px] font-mono font-medium text-primary sm:text-right">
                  +{purchase.stampsAdded}
                </span>
                <span className="text-[13px] font-mono text-foreground sm:text-right tabular-nums">
                  {formatAmount(purchase.amountMxn)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
