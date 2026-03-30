'use client'

const config = {
  draft: {
    label: 'Borrador',
    className: 'bg-muted text-muted-foreground',
  },
  timbrada: {
    label: 'Timbrada',
    className: 'bg-primary/15 text-primary',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'bg-destructive/15 text-destructive',
  },
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { label, className } = config[status as keyof typeof config] ?? config.draft

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${className} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[11px]'
      }`}
    >
      {label}
    </span>
  )
}
