'use client'

import { DollarSign, FileText, Users, TrendingUp } from 'lucide-react'
import { StatsCard } from './stats-card'

interface DashboardStatsProps {
  stats: {
    totalInvoiced: number
    invoicesThisMonth: number
    activeClients: number
    growth: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Facturado"
        value={formatCurrency(stats.totalInvoiced)}
        icon={DollarSign}
        trend={{
          value: `+${stats.growth}% vs mes anterior`,
          isPositive: stats.growth > 0
        }}
      />

      <StatsCard
        title="Facturas Este Mes"
        value={stats.invoicesThisMonth}
        icon={FileText}
        subtitle={`${Math.floor(stats.invoicesThisMonth / 30)} promedio diario`}
      />

      <StatsCard
        title="Clientes Activos"
        value={stats.activeClients}
        icon={Users}
        subtitle="3 nuevos este mes"
      />

      <StatsCard
        title="Crecimiento"
        value={`${stats.growth}%`}
        icon={TrendingUp}
        trend={{
          value: "vs mes anterior",
          isPositive: stats.growth > 0
        }}
      />
    </div>
  )
}
