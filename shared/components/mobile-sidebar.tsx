"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Receipt } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";
import { NavItem } from "./nav-item";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 border-border/50 bg-sidebar p-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <SheetHeader className="px-5 pt-5 pb-4">
            <SheetTitle className="text-left">
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setOpen(false)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                  <Receipt className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  FacturaFast
                </span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          {/* Navigation */}
          <nav
            className="flex-1 space-y-6 overflow-y-auto px-3 py-2"
            onClick={() => setOpen(false)}
          >
            <div>
              <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>

            <div className="space-y-1">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Ventas
              </p>
              <NavItem href="/invoices" icon={Receipt} label="Facturas" />
              <NavItem href="/quotes" icon={FileText} label="Cotizaciones" />
              <NavItem href="/credit-notes" icon={CreditCard} label="Notas de Crédito" />
            </div>

            <div className="space-y-1">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Catálogos
              </p>
              <NavItem href="/clients" icon={Users} label="Clientes" />
              <NavItem href="/products" icon={Package} label="Productos" />
            </div>

            <div className="space-y-1">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Análisis
              </p>
              <NavItem href="/reports" icon={BarChart3} label="Reportes" />
            </div>

            <div>
              <NavItem href="/settings" icon={Settings} label="Configuración" />
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
