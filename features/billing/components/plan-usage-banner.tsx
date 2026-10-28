'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'

interface StampsBannerProps {
  stampsBalance: number
}

/** One-line stamp balance with a link to buy more; warns only when 1 or 0 are left. */
export function StampsBanner({ stampsBalance }: StampsBannerProps) {
  const isDepleted = stampsBalance <= 0
  const isLow = !isDepleted && stampsBalance <= 1

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-[4px] border-l-2 bg-hoja px-4 py-2.5 shadow-[var(--shadow-hoja)]',
        isDepleted ? 'border-tinta-roja' : isLow ? 'border-ocre' : 'border-renglon',
      )}
    >
      <p className="text-[13px] text-tinta-tenue">
        {isDepleted ? (
          <span className="font-medium text-tinta-roja">Te quedaste sin timbres. Compra un paquete para seguir timbrando.</span>
        ) : (
          <>
            Te {stampsBalance === 1 ? 'queda' : 'quedan'}{' '}
            <span className={cn('font-mono font-medium', isLow ? 'text-ocre' : 'text-tinta')}>{stampsBalance}</span>{' '}
            {stampsBalance === 1 ? 'timbre' : 'timbres'}
          </>
        )}
      </p>

      <Link
        href="/billing"
        className={cn(
          'text-[13px] font-medium underline-offset-4 hover:underline',
          isDepleted ? 'text-tinta-roja' : 'text-sello',
        )}
      >
        {isDepleted || isLow ? 'Recargar timbres' : 'Comprar timbres'}
      </Link>
    </div>
  )
}
