# FacturaFast Design System

## Direction
Professional business tool with emerald accent, tuned per mode. Dense, efficient, serious. Inspired by Vercel/Linear.

## Color Palette

### Dark Mode (default)
- **Background:** `#09090b` (near-black)
- **Card:** `#111113` (elevated surface)
- **Muted:** `#18181b` (secondary surface)
- **Border:** `#232328` (subtle separation)
- **Sidebar:** `#0c0c0e` (darker than bg)
- **Primary:** `#10b981` (emerald-500 — vibrant on dark)
- **Primary foreground:** `#022c22` (dark text on emerald buttons)
- **Foreground:** `#fafafa`
- **Muted foreground:** `#a1a1aa`

### Light Mode
- **Background:** `#fafafa`
- **Card:** `#ffffff`
- **Muted:** `#f4f4f5`
- **Border:** `#e4e4e7`
- **Input border:** `#d4d4d8` (slightly stronger than border)
- **Sidebar:** `#ffffff`
- **Primary:** `#059669` (emerald-600 — darker for 5.1:1 contrast on white)
- **Primary foreground:** `#ecfdf5` (light text on emerald buttons)
- **Foreground:** `#09090b`
- **Muted foreground:** `#52525b`

### Semantic (shared)
- **Destructive:** `#ef4444`
- **Warning:** `#f59e0b`
- **Success:** matches primary per mode

## Depth Strategy
- **Dark:** Borders only. No shadows. Cards use `border-border/60`, hover `border-border`. Layered surfaces create hierarchy.
- **Light:** Borders + subtle `shadow-sm` on elevated elements. Cards use `border-border/60`.

## Typography
- **Font:** Geist Sans (`--font-geist-sans`)
- **Mono:** Geist Mono (RFC, codes, postal codes)
- **Page titles:** `text-2xl font-semibold tracking-tight`
- **Section labels:** `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60`
- **Body:** `text-sm`
- **Small/meta:** `text-[13px] text-muted-foreground`

## Spacing
Base unit: 4px. Key values: `p-5` cards, `gap-3`/`gap-4` grids, `space-y-6`/`space-y-8` page sections.

## Navigation
- Sidebar: `w-60`, emerald active state (`bg-primary/10 text-primary`)
- Nav items: `h-4 w-4` icons, `text-sm`, `rounded-lg`
- Section headers: `text-[11px]` uppercase tracking-wider
- Header: `h-14`, blur backdrop, `border-border/50`

## Status Badges
- Draft: `bg-muted text-muted-foreground`
- Timbrada: `bg-primary/15 text-primary`
- Cancelada: `bg-destructive/15 text-destructive`

## Component Patterns
- **Cards:** `rounded-xl border border-border/60 bg-card`
- **Inputs:** `bg-muted/50 border-input`, focus: `ring-2 ring-ring/40`
- **Buttons default:** `bg-primary text-primary-foreground`, `rounded-lg`, `shadow-sm`
- **Buttons outline:** `border-border/60 bg-background`, hover `bg-muted/50`
- **Buttons ghost:** `text-muted-foreground`, hover `bg-muted/50 text-foreground`
- **Empty states:** Centered icon in `rounded-full bg-muted p-4`, title + subtitle + CTA

## Theme Toggle
- `next-themes` with `attribute="class"`, default dark
- Sun icon in dark mode, moon icon in light mode
- Clerk syncs via `ClerkThemeSync` component with per-mode hex values

## UI Library
- Tailwind CSS v4 with `@theme` directive
- shadcn/ui components (Radix primitives)
- Lucide React icons
- Sonner toasts (auto-detects theme)
- Clerk auth with `@clerk/themes` dark base
