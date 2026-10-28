"use client";

import { Show, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UsageIndicator } from "@features/billing/components/usage-indicator";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { Logo } from "./logo";
import { NAV_ENTRIES } from "./nav-config";
import { NavItem } from "./nav-item";

interface MobileSidebarProps {
  stampsBalance?: number;
}

export function MobileSidebar({ stampsBalance = 0 }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 border-renglon bg-sidebar p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="px-5 pt-5 pb-4">
            <SheetTitle className="text-left">
              <Link href="/dashboard" onClick={close} aria-label="FacturaFast, inicio">
                <Logo />
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Principal">
            {NAV_ENTRIES.map((entry) => (
              <NavItem key={entry.href} {...entry} onNavigate={close} />
            ))}
          </nav>

          <UsageIndicator stampsBalance={stampsBalance} />

          <div className="border-t border-renglon px-4 py-3">
            <Show when="signed-in">
              <UserButton showName />
            </Show>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
