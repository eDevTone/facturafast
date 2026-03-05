import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Receipt, Users, Package, TrendingUp, FileText, ArrowUpRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen de tu actividad de facturación
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Facturado */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Total Facturado
            </p>
            <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            $45,230
          </p>
          <p className="mt-2 text-[13px] text-primary">
            <span className="font-medium">↑</span> +20.1% vs mes anterior
          </p>
        </div>

        {/* Facturas */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Facturas
            </p>
            <Receipt className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            145
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            +18 este mes
          </p>
        </div>

        {/* Clientes */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Clientes
            </p>
            <Users className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            32
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            +5 nuevos este mes
          </p>
        </div>

        {/* Productos */}
        <div className="rounded-xl border border-border/60 bg-card p-5 transition-colors hover:border-border">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">
              Productos
            </p>
            <Package className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">
            89
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            En catálogo
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
            <button className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Ver todo <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay actividad reciente
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Tu actividad de facturación aparecerá aquí
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
