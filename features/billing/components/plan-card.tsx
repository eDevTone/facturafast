'use client'

import { Check, Zap } from 'lucide-react'
import { Button } from '@shared/ui/button'
import type { PlanDefinition, PlanId } from '../types/billing.types'

interface PlanCardProps {
  plan: PlanDefinition
  currentPlan: PlanId
  onSelect: (planId: PlanId) => void
  isLoading?: boolean
}

export function PlanCard({ plan, currentPlan, onSelect, isLoading }: PlanCardProps) {
  const isCurrent = plan.id === currentPlan
  const isRecommended = plan.recommended
  const isDowngrade = getPlanOrder(plan.id) < getPlanOrder(currentPlan)

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

      {/* Plan name */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {plan.name}
      </p>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
          ${plan.price}
        </span>
        <span className="text-[13px] text-muted-foreground/50">/mes</span>
      </div>

      {/* Regular price */}
      <p className="mt-1 text-[12px] text-muted-foreground/40 line-through">
        ${plan.regularPrice} MXN/mes
      </p>

      {/* Stamps hero */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {plan.stamps === Infinity ? 'Ilimitados' : plan.stamps}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {plan.stamps === Infinity ? '' : 'timbres/mes'}
        </span>
      </div>

      {/* Features */}
      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map(feature => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 text-primary/60 shrink-0" />
            <span className="text-[13px] text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-5">
        {isCurrent ? (
          <Button variant="outline" className="w-full" disabled>
            Plan actual
          </Button>
        ) : isDowngrade ? (
          <Button variant="outline" className="w-full" disabled>
            —
          </Button>
        ) : (
          <Button
            className={`w-full ${isRecommended ? '' : 'bg-foreground text-background hover:bg-foreground/90'}`}
            onClick={() => onSelect(plan.id)}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Elegir plan'}
          </Button>
        )}
      </div>
    </div>
  )
}

function getPlanOrder(plan: PlanId): number {
  const order: Record<PlanId, number> = { free: 0, starter: 1, pro: 2, business: 3 }
  return order[plan]
}
