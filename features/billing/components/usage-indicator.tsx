'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface UsageIndicatorProps {
  stampsBalance: number
}

/** Stamp balance in the sidebar, drawn as a small perforated timbre. */
export function UsageIndicator({ stampsBalance }: UsageIndicatorProps) {
  const isDepleted = stampsBalance <= 0
  const isLow = !isDepleted && stampsBalance <= 1

  return (
    <div className="mx-3 mb-2">
      <Link
        href="/billing"
        className="timbre block rounded-[2px] transition-opacity hover:opacity-90"
        aria-label={`${stampsBalance} timbres disponibles. Comprar timbres`}
      >
        <div className="timbre-cara flex items-center justify-between gap-2 px-3 py-2">
          <span className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'font-mono text-lg font-medium leading-none',
                isDepleted ? 'text-tinta-roja' : isLow ? 'text-ocre' : 'text-tinta',
              )}
            >
              {stampsBalance}
            </span>
            <span className="text-[12px] text-tinta-tenue">{stampsBalance === 1 ? 'timbre' : 'timbres'}</span>
          </span>
          <span className={cn('text-[12px] font-medium', isDepleted ? 'text-tinta-roja' : 'text-sello')}>
            {isDepleted ? 'Recargar' : 'Comprar'}
          </span>
        </div>
      </Link>
    </div>
  )
}
