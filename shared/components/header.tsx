"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  stampsBalance?: number;
}

/** Top bar: on mobile it carries the menu and the logo; on desktop only the theme switch. */
export function Header({ stampsBalance }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-renglon bg-background/85 px-4 backdrop-blur-sm sm:px-6">
      <MobileSidebar stampsBalance={stampsBalance} />
      <Link href="/dashboard" className="md:hidden" aria-label="FacturaFast, inicio">
        <Logo />
      </Link>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}
