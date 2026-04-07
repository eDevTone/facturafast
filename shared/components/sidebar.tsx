"use client";

import { Show, UserButton } from "@clerk/nextjs";
import {
  Building2,
  LayoutDashboard,
  Receipt,
  Users,
} from "lucide-react";
import Link from "next/link";
import { NavItem } from "./nav-item";
import { UsageIndicator } from "@features/billing/components/usage-indicator";

interface SidebarProps {
  stampsBalance: number;
}

export function Sidebar({ stampsBalance }: SidebarProps) {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border/50 bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Receipt className="h-4 w-4 text-primary-foreground" />
        </div>
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-foreground">
          FacturaFast
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pt-2 pb-4">
        <div>
          <NavItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
          />
        </div>

        {/* Ventas */}
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Ventas
          </p>
          <NavItem href="/invoices" icon={Receipt} label="Facturas" />
        </div>

        {/* Catálogos */}
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Catálogos
          </p>
          <NavItem href="/clients" icon={Users} label="Clientes" />
        </div>

        {/* Configuración */}
        <div className="space-y-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Configuración
          </p>
          <NavItem href="/fiscal-profiles" icon={Building2} label="Perfiles Fiscales" />
        </div>
      </nav>

      {/* Usage */}
      <UsageIndicator stampsBalance={stampsBalance} />

      {/* User */}
      <div className="border-t border-border/50 px-4 py-3">
        <Show when="signed-in">
          <UserButton
            showName
            appearance={{
              elements: {
                userButtonBox: "flex-row-reverse",
                userButtonOuterIdentifier: "text-sm text-foreground",
              },
            }}
          />
        </Show>
      </div>
    </aside>
  );
}
