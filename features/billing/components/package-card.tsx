'use client'

import { Button } from '@shared/ui/button'
import { Check, Zap } from 'lucide-react'
import type { StampPackage, StampPackageId } from '../types/billing.types'

interface PackageCardProps {
  pkg: StampPackage
  onSelect: (packageId: StampPackageId) => void
  isLoading?: boolean
}

export function PackageCard({ pkg, onSelect, isLoading }: PackageCardProps) {
  const isRecommended = 'recommended' in pkg && pkg.recommended

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 transition-colors ${
        isRecommended
          ? 'border-primary/40 bg-primary/[0.03]'
          : 'border-border/60 bg-card'
      }`}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute -top-2.5 left-4">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            <Zap className="h-2.5 w-2.5" />
            Recomendado
          </span>
        </div>
      )}

      {/* Package name */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {pkg.name}
      </p>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
          ${pkg.price}
        </span>
        <span className="text-[13px] text-muted-foreground/50">MXN</span>
      </div>

      {/* Stamps hero */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {pkg.stamps}
        </span>
        <span className="text-[13px] text-muted-foreground">
          timbres
        </span>
      </div>

      {/* Features */}
      <ul className="mt-4 flex-1 space-y-2">
        {pkg.features.map(feature => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span className="text-[13px] text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-5">
        <Button
          className={`w-full ${isRecommended ? '' : 'bg-foreground text-background hover:bg-foreground/90'}`}
          onClick={() => onSelect(pkg.id as StampPackageId)}
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : 'Comprar'}
        </Button>
      </div>
    </div>
  )
}
