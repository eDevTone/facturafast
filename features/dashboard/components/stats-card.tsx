'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@shared/ui/card'

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
    <Card className="border-border hover:border-primary transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent" />
          </div>
        </div>
        
        {trend && (
          <p className={`text-sm mt-3 flex items-center gap-1 ${
            trend.isPositive ? 'text-success' : 'text-destructive'
          }`}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            {trend.value}
          </p>
        )}
        
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-3">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
