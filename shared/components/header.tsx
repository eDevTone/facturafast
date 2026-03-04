"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile Menu */}
      <MobileSidebar />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User */}
        <Show when="signed-out">
          <SignInButton>
            <Button variant="outline" size="sm">
              Iniciar sesión
            </Button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
