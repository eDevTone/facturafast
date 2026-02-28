'use client'

import { DollarSign, FileText, Users, TrendingUp } from 'lucide-react'
import { StatsCard } from './stats-card'

interface DashboardStatsProps {
  stats: {
    totalFacturado: number
    facturasEsteMes: number
    clientesActivos: number
    crecimiento: number
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
        value={formatCurrency(stats.totalFacturado)}
        icon={DollarSign}
        trend={{
          value: `+${stats.crecimiento}% vs mes anterior`,
          isPositive: stats.crecimiento > 0
        }}
      />
      
      <StatsCard
        title="Facturas Este Mes"
        value={stats.facturasEsteMes}
        icon={FileText}
        subtitle={`${Math.floor(stats.facturasEsteMes / 30)} promedio diario`}
      />
      
      <StatsCard
        title="Clientes Activos"
        value={stats.clientesActivos}
        icon={Users}
        subtitle="3 nuevos este mes"
      />
      
      <StatsCard
        title="Crecimiento"
        value={`${stats.crecimiento}%`}
        icon={TrendingUp}
        trend={{
          value: "vs mes anterior",
          isPositive: stats.crecimiento > 0
        }}
      />
    </div>
  )
}
