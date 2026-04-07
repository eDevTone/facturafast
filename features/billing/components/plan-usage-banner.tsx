'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

interface StampsBannerProps {
  stampsBalance: number
}

export function StampsBanner({ stampsBalance }: StampsBannerProps) {
  const isLow = stampsBalance < 10
  const isDepleted = stampsBalance === 0

  const iconColor = isDepleted
    ? 'text-destructive'
    : isLow
      ? 'text-amber-500'
      : 'text-primary/60'

  return (
    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Zap className={`h-3.5 w-3.5 ${iconColor}`} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Saldo
        </span>
        <span className="text-muted-foreground/30">·</span>
        {isDepleted ? (
          <span className="text-[13px] text-destructive font-medium">Sin timbres disponibles</span>
        ) : (
          <span className={`text-[13px] ${isLow ? 'text-amber-500' : 'text-muted-foreground'}`}>
            <span className="font-mono font-medium">{stampsBalance}</span> timbres disponibles
          </span>
        )}
      </div>

      <Link
        href="/billing"
        className={`text-[13px] font-medium transition-colors ${
          isDepleted || isLow
            ? 'text-destructive hover:text-destructive/80'
            : 'text-muted-foreground/50 hover:text-foreground'
        }`}
      >
        {isDepleted || isLow ? 'Recargar →' : 'Comprar timbres →'}
      </Link>
    </div>
  )
}
