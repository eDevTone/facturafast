import { cn } from '@/lib/utils'

/**
 * Invoice number as pre-printed on a talonario: "Nº A-0127".
 * `tone="roja"` is reserved for the document header; lists use ink.
 */
export function Folio({
  serie,
  folio,
  tone = 'tinta',
  className,
}: {
  serie: string | null
  folio: number
  tone?: 'tinta' | 'roja'
  className?: string
}) {
  const number = folio.toString().padStart(4, '0')
  const label = `${serie ? `${serie}-` : ''}${number}`
  return (
    <span
      title={`Nº ${label}`}
      className={cn('whitespace-nowrap font-mono tabular-nums', tone === 'roja' ? 'text-tinta-roja' : 'text-tinta', className)}
    >
      <span className="mr-1 text-[0.8em] opacity-70">Nº</span>
      {label}
    </span>
  )
}
