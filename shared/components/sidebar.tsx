"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { UsageIndicator } from "@features/billing/components/usage-indicator";
import { Logo } from "./logo";
import { NAV_ENTRIES } from "./nav-config";
import { NavItem } from "./nav-item";

interface SidebarProps {
  stampsBalance: number;
}

export function Sidebar({ stampsBalance }: SidebarProps) {
  return (
    <aside className="flex h-screen w-60 flex-col border-r border-renglon bg-sidebar">
      <div className="flex h-14 items-center px-5">
        <Link href="/dashboard" aria-label="FacturaFast, inicio">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pt-3 pb-4" aria-label="Principal">
        {NAV_ENTRIES.map((entry) => (
          <NavItem key={entry.href} {...entry} />
        ))}
      </nav>

      <UsageIndicator stampsBalance={stampsBalance} />

      <div className="border-t border-renglon px-4 py-3">
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
