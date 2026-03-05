# FacturaFast Design System

## Direction
Dark professional with emerald accent. Dense, efficient, feels like a serious business tool. Inspired by Vercel/Linear dark mode.

## Color Palette
- **Background:** `#09090b` (near-black)
- **Card:** `#111113` (elevated surface)
- **Muted:** `#18181b` (secondary surface)
- **Border:** `#232328` (subtle separation)
- **Sidebar:** `#0c0c0e` (darker than bg)
- **Primary/Accent:** `#10b981` (emerald — brand, active states, success)
- **Foreground:** `#fafafa`
- **Muted foreground:** `#a1a1aa`
- **Destructive:** `#ef4444`
- **Warning:** `#f59e0b`

## Depth Strategy
**Borders only.** No shadows in dark mode. Cards use `border-border/60` default, `border-border` on hover. Layered dark surfaces create hierarchy (bg → card → muted).

## Typography
- **Font:** Geist Sans (variable `--font-geist-sans`)
- **Mono:** Geist Mono (for RFC, codes)
- **Page titles:** `text-2xl font-semibold tracking-tight`
- **Section labels:** `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60`
- **Body:** `text-sm`
- **Small/meta:** `text-[13px] text-muted-foreground`

## Spacing
Base unit: 4px (Tailwind default). Key values: `p-5` for cards, `gap-3`/`gap-4` for grids, `space-y-6`/`space-y-8` for page sections.

## Navigation
- Sidebar: `w-60`, dark bg, emerald active state (`bg-primary/10 text-primary`)
- Nav items: `h-4 w-4` icons, `text-sm`, rounded-lg
- Section headers: `text-[11px]` uppercase tracking-wider
- Header: `h-14`, blur backdrop, `border-border/50`

## Status Badges
- Draft: `bg-muted text-muted-foreground`
- Timbrada: `bg-primary/15 text-primary`
- Cancelada: `bg-destructive/15 text-destructive`

## Component Patterns
- **Cards:** `rounded-xl border border-border/60 bg-card`, hover: `hover:border-border`
- **Inputs:** `bg-muted/50 border-input`, focus: `ring-1 ring-ring` (emerald)
- **Buttons default:** Emerald bg, dark text
- **Buttons outline:** `border-border bg-transparent`
- **Empty states:** Centered, icon in `rounded-full bg-muted p-4`, title + subtitle + CTA

## UI Library
- Tailwind CSS v4 with `@theme` directive
- shadcn/ui components (Radix primitives)
- Lucide React icons
- Sonner toasts (dark theme)
- Clerk auth (dark appearance)
