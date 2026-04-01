'use client'

import { formatDateShort } from '@shared/utils/date'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import type { PlanId } from '../types/billing.types'
import { PLAN_LABELS } from '../types/billing.types'

interface UsageIndicatorProps {
  plan: PlanId
  stampsUsed: number
  stampsLimit: number
  periodEnd: Date
}

export function UsageIndicator({ plan, stampsUsed, stampsLimit, periodEnd }: UsageIndicatorProps) {
  const isUnlimited = plan === 'business'
  const percentage = isUnlimited ? 0 : Math.min((stampsUsed / stampsLimit) * 100, 100)
  const remaining = isUnlimited ? Infinity : stampsLimit - stampsUsed
  const isWarning = !isUnlimited && percentage >= 80 && percentage < 100
  const isDepleted = !isUnlimited && percentage >= 100

  const barColor = isDepleted
    ? 'bg-destructive'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-primary'

  const renewalDate = formatDateShort(periodEnd)

  return (
    <div className="mx-3 mb-2">
      <div
        className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 space-y-2"
        title={
          isUnlimited
            ? 'Plan Business — timbres ilimitados'
            : `${remaining} timbres restantes. Se renueva el ${renewalDate}.`
        }
      >
        {/* Header: count + plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-muted-foreground/60" />
            {isUnlimited ? (
              <span className="text-[12px] font-medium text-foreground">
                Ilimitado
              </span>
            ) : (
              <span className="text-[12px] font-medium text-foreground">
                <span className={isDepleted ? 'text-destructive' : ''}>
                  {stampsUsed}
                </span>
                <span className="text-muted-foreground/60">/{stampsLimit}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
            {PLAN_LABELS[plan]}
          </span>
        </div>

        {/* Progress bar */}
        {!isUnlimited && (
          <div className="h-1 w-full rounded-full bg-border/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}

        {/* Upgrade link (only for non-business) */}
        {plan !== 'business' && (
          <Link
            href="/billing"
            className={`block text-[11px] font-medium transition-colors ${
              isDepleted
                ? 'text-destructive hover:text-destructive/80'
                : 'text-muted-foreground/50 hover:text-foreground'
            }`}
          >
            {isDepleted ? 'Límite alcanzado · Upgrade' : 'Upgrade →'}
          </Link>
        )}
      </div>
    </div>
  )
}
