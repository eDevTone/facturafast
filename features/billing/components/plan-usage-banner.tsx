'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { PlanId } from '../types/billing.types'
import { PLAN_LABELS } from '../types/billing.types'

interface PlanUsageBannerProps {
  plan: PlanId
  stampsUsed: number
  stampsLimit: number
}

export function PlanUsageBanner({ plan, stampsUsed, stampsLimit }: PlanUsageBannerProps) {
  const isUnlimited = plan === 'business'
  const percentage = isUnlimited ? 0 : Math.min((stampsUsed / stampsLimit) * 100, 100)
  const isWarning = !isUnlimited && percentage >= 80 && percentage < 100
  const isDepleted = !isUnlimited && percentage >= 100

  const iconColor = isDepleted
    ? 'text-destructive'
    : isWarning
      ? 'text-amber-500'
      : 'text-primary/60'

  const countColor = isDepleted
    ? 'text-destructive'
    : isWarning
      ? 'text-amber-500'
      : 'text-muted-foreground'

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Zap className={`h-3.5 w-3.5 ${iconColor}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {PLAN_LABELS[plan]}
        </span>
        <span className="text-muted-foreground/30">·</span>
        {isUnlimited ? (
          <span className="text-[13px] text-muted-foreground">Timbres ilimitados</span>
        ) : isDepleted ? (
          <span className="text-[13px] text-destructive font-medium">Límite alcanzado</span>
        ) : (
          <span className={`text-[13px] ${countColor}`}>
            <span className="font-mono font-medium">{stampsUsed}/{stampsLimit}</span> timbres usados
          </span>
        )}
      </div>

      {plan !== 'business' && (
        <Link
          href="/billing"
          className={`text-[13px] font-medium transition-colors ${
            isDepleted
              ? 'text-destructive hover:text-destructive/80'
              : 'text-muted-foreground/50 hover:text-foreground'
          }`}
        >
          {isDepleted ? 'Upgrade →' : 'Upgrade →'}
        </Link>
      )}
    </div>
  )
}
