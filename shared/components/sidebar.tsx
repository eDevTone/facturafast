"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Receipt,
  Users,
  Package,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
} from "lucide-react";
import { NavItem } from "./nav-item";

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Receipt className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">
            FacturaFast
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavItem
          href="/dashboard"
          icon={LayoutDashboard}
          label="Dashboard"
        />

        {/* Ventas Section */}
        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Ventas
          </p>
          <NavItem
            href="/facturas"
            icon={Receipt}
            label="Facturas"
          />
          <NavItem
            href="/cotizaciones"
            icon={FileText}
            label="Cotizaciones"
          />
          <NavItem
            href="/notas-credito"
            icon={CreditCard}
            label="Notas de Crédito"
          />
        </div>

        {/* Catálogos Section */}
        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Catálogos
          </p>
          <NavItem
            href="/clientes"
            icon={Users}
            label="Clientes"
          />
          <NavItem
            href="/productos"
            icon={Package}
            label="Productos"
          />
        </div>

        {/* Reportes Section */}
        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
            Análisis
          </p>
          <NavItem
            href="/reportes"
            icon={BarChart3}
            label="Reportes"
          />
        </div>

        {/* Configuración Section */}
        <div className="pt-4">
          <NavItem
            href="/configuracion"
            icon={Settings}
            label="Configuración"
          />
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            ET
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">eTone</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
