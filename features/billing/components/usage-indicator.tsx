'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'

interface UsageIndicatorProps {
  stampsBalance: number
}

export function UsageIndicator({ stampsBalance }: UsageIndicatorProps) {
  const isLow = stampsBalance < 10
  const isDepleted = stampsBalance === 0

  return (
    <div className="mx-3 mb-2">
      <div
        className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5 space-y-2"
        title={`${stampsBalance} timbres disponibles`}
      >
        {/* Balance */}
        <div className="flex items-center gap-1.5">
          <Zap className={`h-3 w-3 ${isDepleted ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-muted-foreground/60'}`} />
          <span className="text-[12px] font-medium text-foreground">
            <span className={isDepleted ? 'text-destructive' : isLow ? 'text-amber-500' : ''}>
              {stampsBalance}
            </span>
            <span className="text-muted-foreground/60"> timbres disponibles</span>
          </span>
        </div>

        {/* Recargar link */}
        <Link
          href="/billing"
          className={`block text-[11px] font-medium transition-colors ${
            isDepleted
              ? 'text-destructive hover:text-destructive/80'
              : isLow
                ? 'text-amber-500 hover:text-amber-400'
                : 'text-muted-foreground/50 hover:text-foreground'
          }`}
        >
          {isDepleted ? 'Sin timbres · Recargar' : isLow ? 'Pocos timbres · Recargar' : 'Comprar timbres →'}
        </Link>
      </div>
    </div>
  )
}
