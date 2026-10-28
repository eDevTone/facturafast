'use client'

import { SectionLabel } from '@shared/components/section-label'
import { formatDateShort } from '@shared/utils/date'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
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
  return formatCurrency(amountMxn / 100)
}

export function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  return (
    <section className="space-y-3">
      <SectionLabel rule={false}>Compras</SectionLabel>

      {purchases.length === 0 ? (
        <p className="hoja-borrador px-5 py-6 text-center text-sm text-tinta-tenue">
          Aún no compras timbres. Aquí verás cada paquete que pagues.
        </p>
      ) : (
        <div className="hoja overflow-hidden">
          <div className="hidden items-center gap-3 border-b border-renglon px-5 py-2.5 text-[12px] font-medium text-tinta-tenue sm:grid sm:grid-cols-[1fr_120px_80px_110px]">
            <span>Fecha</span>
            <span>Paquete</span>
            <span className="text-right">Timbres</span>
            <span className="text-right">Monto</span>
          </div>

          <div className="divide-y divide-renglon">
            {purchases.map(purchase => (
              <div
                key={purchase.id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-5 py-3 sm:grid-cols-[1fr_120px_80px_110px]"
              >
                <span className="font-mono text-[13px] text-tinta-tenue">{formatDateShort(purchase.createdAt)}</span>
                <span className="text-sm text-tinta sm:order-none">{getPackageName(purchase.packageId)}</span>
                <span className="font-mono text-[13px] text-sello sm:text-right">+{purchase.stampsAdded}</span>
                <span className="text-right font-mono text-[13px] text-tinta">{formatAmount(purchase.amountMxn)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
