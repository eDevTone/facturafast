import { cn } from '@/lib/utils'

/**
 * FacturaFast mark: the letters FF inside a rubber stamp.
 */
export function Logo({ className, withName = true }: { className?: string; withName?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="inline-flex h-7 w-8 items-center justify-center rounded-[6px] border-[1.5px] border-sello font-mono text-[13px] font-medium leading-none tracking-tight text-sello shadow-[inset_0_0_0_2px_var(--color-papel),inset_0_0_0_3px_var(--color-sello)]"
      >
        FF
      </span>
      {withName && <span className="text-[15px] font-semibold tracking-tight text-tinta">FacturaFast</span>}
    </span>
  )
}
