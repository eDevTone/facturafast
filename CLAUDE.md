# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push schema to DB (interactive — use `pnpm dlx drizzle-kit push --force` to skip confirmation)
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed:sat      # Seed SAT catalogs
```

## Architecture

Mexican invoicing (facturación electrónica CFDI 4.0) SaaS. Next.js 16 App Router, Drizzle ORM on Neon PostgreSQL, Clerk auth, shadcn/ui.

### Feature Modules (`features/`)

Each domain has a self-contained module under `features/`:

- **invoicing** — Invoice CRUD, PDF generation, line items, status tracking (draft → timbrada → cancelada)
- **clients** — Client/receptor management with soft delete, CSF upload for auto-fill
- **fiscal-profile** — Multi-RFC issuing profiles, CSD certificate upload/validation/encryption
- **dashboard** — Analytics with real DB queries
- **timbrado** — PAC integration (planned)

Each module follows: `components/` → `actions/` → `services/` → `types/` → `schemas/`

### Data Flow Pattern

**Server Component (page.tsx)** fetches data → passes as props to **Client Component** → user submits → **Server Action** (`'use server'`) → **Service** (Drizzle query) → DB. No API routes — everything is server actions.

### Key Files

- `database/client.ts` — Drizzle client singleton (`prepare: false` for Neon pooler)
- `database/schemas/index.ts` — All schema exports
- `middleware.ts` — Clerk auth, protects all routes except `/sign-in`, `/sign-up`
- `shared/services/sat-catalog.service.ts` — Centralized SAT catalog queries from DB (replaces all hardcoded catalogs)
- `features/fiscal-profile/services/certificate.service.ts` — AES-256-GCM encryption, X.509 parsing with node-forge

### Path Aliases

```
@features/*  → ./features/*
@shared/*    → ./shared/*
@database/*  → ./database/*
@/*          → ./*
```

### Auth Pattern

Every server action and page calls `const { userId } = await auth()` from `@clerk/nextjs/server`. All DB queries filter by `userId`. Multi-tenant by design — users only see their own data.

### SAT Catalogs

SAT catalog data lives in DB tables (not hardcoded). Use `sat-catalog.service.ts` to fetch options for forms or label maps for display. Server pages fetch catalogs and pass them as props to client components.

### Multi-RFC / Issuing Profiles

Users can have multiple RFC (issuing profiles). Invoices reference `issuingProfileId`. When creating an invoice, the form auto-selects the default profile if only one exists, or shows a picker for multiple.

### Certificate Handling

CSD certificates (.cer/.key) are processed server-side in `certificate.service.ts`:
- `.cer` parsed with node-forge to extract serial number, RFC, validity
- `.cer` and `.key` validated as matching pair (sign + verify)
- Password encrypted with AES-256-GCM before DB storage
- Requires `CERTIFICATE_ENCRYPTION_KEY` env var (32 bytes hex)

## Design System

- Dark-first emerald theme (`#10b981` dark, `#059669` light)
- Depth: borders only in dark mode, subtle shadows in light
- Cards: `rounded-xl border border-border/60 bg-card`
- Section labels: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60`
- Forms wrapped in card containers; actions (Cancel/Save) outside the card
- Status badges: draft=muted, timbrada=primary/15, cancelada=destructive/15
- See `.interface-design/system.md` for full design tokens

## Environment Variables

```
DATABASE_URL                        # Neon PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   # Clerk public key
CLERK_SECRET_KEY                    # Clerk secret key
CERTIFICATE_ENCRYPTION_KEY          # AES-256 key for CSD passwords (64 hex chars)
```
