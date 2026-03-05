'use client'

import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  subtitle?: string
}

export function StatsCard({ title, value, icon: Icon, trend, subtitle }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground/60" />
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>

      {trend && (
        <p className={`mt-2 text-[13px] ${
          trend.isPositive ? 'text-primary' : 'text-destructive'
        }`}>
          <span className="font-medium">{trend.isPositive ? '↑' : '↓'}</span>{' '}
          {trend.value}
        </p>
      )}

      {subtitle && (
        <p className="mt-2 text-[13px] text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}
