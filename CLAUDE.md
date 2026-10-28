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
- **clients** — Client/receptor management with soft delete, CSF upload for auto-fill, and "Pedir datos a un cliente": a one-use link (`/datos/<token>`) where the client types their own fiscal data
- **fiscal-profile** — Multi-RFC issuing profiles, CSD certificate upload/validation/encryption
- **dashboard** — Analytics with real DB queries
- **stamping** — SW Sapien PAC integration for CFDI stamping (JSON emission) and cancellation, plus the SAT status service (`sat-status.service.ts`)
- **payments** — Complementos de pago (CFDI tipo P, Pagos 2.0): "Registrar cobro", the talón, and correcting or cancelling the last payment
- **catalog** — "Mis servicios": saved concepts (description, ClaveProdServ, ClaveUnidad, price before IVA) that fill invoice lines
- **exchange-rates** — The DOF dollar rate for a day (Banxico series SF60653), cached in `exchange_rates`; invoices and complementos de pago in USD use it
- **collections** — Cobranza: whether an invoice is owed or overdue (`collectionState`), "Te deben" in the Inicio, marking a PUE as awaiting payment, and payment reminders by WhatsApp (wa.me) or email
- **recurring** — "Repetir cada mes" (igualas): a template per recurring invoice, the daily cron (`app/api/cron/daily`) that makes each month's invoice and sends automatic payment reminders
- **accountant** — "Para tu contador": a month's XML and PDF in a ZIP with a CSV summary (`fflate`, stored in R2 and handed out with a signed URL), and a private link (`/contador/<token>`) for the accountant

Each module follows: `components/` → `actions/` → `services/` → `types/` → `schemas/`

### Data Flow Pattern

**Server Component (page.tsx)** fetches data → passes as props to **Client Component** → user submits → **Server Action** (`'use server'`) → **Service** (Drizzle query) → DB. No API routes except webhooks (`app/api/webhooks`) and the daily cron (`app/api/cron/daily`, Vercel Cron, checked with `CRON_SECRET`).

### Key Files

- `database/client.ts` — Drizzle client singleton (`prepare: false` for Neon pooler)
- `database/schemas/index.ts` — All schema exports
- `middleware.ts` — Clerk auth, protects all routes except `/sign-in`, `/sign-up`, webhooks, the cron, and the token pages `/contador` and `/datos`
- `shared/utils/share-token.ts` — Tokens of links shared outside the app: found by SHA-256, kept encrypted so the user can copy the link again
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

- "Talonario": paper (`papel`/`hoja`), ink (`tinta`), one accent (`sello` stamp blue); light by default, dark with `.dark`
- IBM Plex Sans for UI, IBM Plex Mono for folio, RFC, UUID, SAT codes and amounts
- Depth: only sheets lift (`.hoja`); drafts use `.hoja-borrador`; rows are separated by `border-renglon` rules
- Section labels: sentence case via `SectionLabel`, never uppercase eyebrows
- Status badges: `StatusBadge` mini stamps (timbrada = sello, cancelada = tinta-roja, borrador = dashed)
- Never use Tailwind palette colors (emerald, amber, blue…) in components
- See `.interface-design/system.md` for full design tokens

## Environment Variables

```
DATABASE_URL                        # Neon PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY   # Clerk public key
CLERK_SECRET_KEY                    # Clerk secret key
CERTIFICATE_ENCRYPTION_KEY          # AES-256 key for CSD passwords (64 hex chars)
SW_URL                              # SW Sapien API URL (test: https://services.test.sw.com.mx)
SW_TOKEN                            # SW Sapien infinite token from ADT portal
SAT_STATUS_URL                      # Optional. SAT ConsultaCFDIService; defaults to SW's test copy with the sandbox SW_URL, and to the SAT otherwise
BANXICO_TOKEN                       # Optional. Banxico SIE API token for the DOF exchange rate; without it the rate is typed by hand
CRON_SECRET                         # Secret of /api/cron/daily; Vercel Cron sends it as "Authorization: Bearer <secret>"
```
