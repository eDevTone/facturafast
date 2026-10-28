import { cn } from '@/lib/utils'

/**
 * Heading of a block inside a sheet: sentence case, quiet ink, with an optional printed rule.
 */
export function SectionLabel({
  children,
  action,
  className,
  rule = true,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  rule?: boolean
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-3 gap-y-2', rule && 'border-b border-renglon pb-2', className)}>
      <h2 className="text-[13px] font-medium text-tinta-tenue">{children}</h2>
      {action}
    </div>
  )
}
