"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  onNavigate?: () => void;
}

export function NavItem({ href, icon: Icon, label, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[4px] px-3 py-2 text-sm transition-colors duration-150",
        isActive
          ? "bg-hoja font-medium text-tinta shadow-[0_0_0_1px_var(--color-renglon)]"
          : "text-tinta-tenue hover:bg-hoja/60 hover:text-tinta"
      )}
    >
      {/* Active page: a stamp-blue tab on the edge, like an index divider */}
      {isActive && <span aria-hidden className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-sm bg-sello" />}
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-sello" : "text-tinta-tenue group-hover:text-tinta")} />
      <span className="flex-1">{label}</span>
    </Link>
  );
}
