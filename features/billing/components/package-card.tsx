'use client'

import { Loader2 } from 'lucide-react'

import { Button } from '@shared/ui/button'
import { formatCurrency } from '@features/invoicing/utils/invoice-calculations'
import type { StampPackage, StampPackageId } from '../types/billing.types'

interface PackageCardProps {
  pkg: StampPackage
  onSelect: (packageId: StampPackageId) => void
  isLoading?: boolean
  disabled?: boolean
  /** Short note under the name, e.g. "Para empezar". */
  note?: string
}

/** A "pliego" of stamps: how many, total price and price per stamp. */
export function PackageCard({ pkg, onSelect, isLoading, disabled, note }: PackageCardProps) {
  const perStamp = pkg.price / pkg.stamps

  return (
    <article className="hoja flex flex-col p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-tinta">{pkg.name}</h3>
        {note && <span className="text-[12px] text-tinta-tenue">{note}</span>}
      </div>

      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-medium leading-none text-tinta">{pkg.stamps}</span>
        <span className="text-[13px] text-tinta-tenue">timbres</span>
      </p>

      <dl className="mt-4 space-y-1 border-t border-renglon pt-3 text-[13px]">
        <div className="flex justify-between gap-2">
          <dt className="text-tinta-tenue">Precio</dt>
          <dd className="font-mono text-tinta">{formatCurrency(pkg.price)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-tinta-tenue">Por timbre</dt>
          <dd className="font-mono text-tinta">{formatCurrency(perStamp)}</dd>
        </div>
      </dl>

      <Button
        className="mt-5 w-full"
        variant="outline"
        onClick={() => onSelect(pkg.id as StampPackageId)}
        disabled={isLoading || disabled}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Abriendo pago…' : `Comprar ${pkg.stamps}`}
      </Button>
    </article>
  )
}
