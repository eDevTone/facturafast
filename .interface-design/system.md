# FacturaFast Design System — "Talonario"

## Direction
A well-made book of invoices for the freelancer who invoices at the end of the month without being an accountant: white paper, black ink, and a blue rubber stamp that confirms something official happened. Calm, precise, in Spanish (es-MX). Light ("papel") is the default; dark is "papel carbón".

Domain vocabulary that drives decisions: folio, timbre/sello, talonario, representación impresa, cadena original, UUID, acuse, constancia, el contador.

## Color (tokens in `app/globals.css`)
Neutral greys and the stamp blue, the same values as the landing (`facturafast-landing/src/styles/global.css`). Change them in both places. Emails (`features/notifications/email`) and `app/global-error.tsx` repeat the light values inline.

| Token | Light | Dark | Use |
|---|---|---|---|
| `papel` | `#f5f5f7` | `#181818` | page background, the desk under the sheets |
| `hoja` | `#ffffff` | `#1f1f1f` | documents, panels, inputs |
| `tinta` | `#141414` | `#ededed` | primary text (black ink) |
| `tinta-tenue` | `#5e5e66` | `#a3a3a3` | secondary text, labels |
| `renglon` | `#e5e5ea` | `#313131` | rules, borders, guilloché |
| `sello` | `#2f4ba8` | `#8fa4f0` | **the only accent**: actions, focus, "timbrada" |
| `sello-tenue` | `#eef1fb` | `#272727` | active/selected washes |
| `tinta-roja` | `#b8382a` | `#e0705f` | folio in the document header, "cancelada", destructive |
| `ocre` / `ocre-tenue` | `#a86a12` / `#f5ecdc` | `#d9a441` / `#2e2716` | warnings (missing/expiring CSD, low balance) |

shadcn names (`primary`, `border`, `muted`, `destructive`…) map onto these, so `shared/ui` keeps working. Never use Tailwind palette colors (emerald, amber, blue…) in components.

## Typography
- **IBM Plex Sans** (400/500/600) for the interface; **IBM Plex Mono** (400/500) for folio, RFC, CP, UUID, SAT codes and every amount (`font-mono` turns on tabular figures).
- Page title: `text-[22px] font-semibold tracking-tight`. Body `text-sm`. Meta `text-[13px] text-tinta-tenue`.
- Section labels are sentence case, `text-[13px] font-medium text-tinta-tenue`, via `SectionLabel` (`shared/components/section-label.tsx`). No uppercase tracked eyebrows — the only uppercase text is inside a rubber stamp.

## Depth, radius, spacing
- Only sheets of paper lift: `.hoja` (4px radius, hairline ring + `--shadow-hoja`). Drafts are `.hoja-borrador` (dashed pencil edge, no lift).
- Rules (`border-renglon`) separate rows like a printed form; they are not frames.
- Radius: 3/4px for paper and small controls, 6px for buttons, inputs and stamps.
- Spacing base 4px. Sheets use `px-5 sm:px-7/8`, `py-5/6`.

## Signature: the stamp
1. **Invoice detail as a sheet** (`invoice-detail.tsx`): guilloché header band (`.guilloche`), folio "Nº A-0127" in `tinta-roja` (`Folio` component), ruled concepts, totals with "Neto a recibir" when there are withholdings.
2. **The stamp** (`.sello`): double-framed rubber stamp next to the totals — `text-sello` "Timbrada · fecha · UUID …a3f9", `text-tinta-roja` rotated +4° for "Cancelada". `.sello-impresion` animates it once (200ms) only right after stamping; respects reduced motion.
3. **Status in lists** (`StatusBadge`): `.sello-mini` — stamp ink for timbrada, red for cancelada, dashed pencil for borrador.
4. **Logo** (`shared/components/logo.tsx`): "FF" inside a small double-framed stamp.
5. **Stamp balance** (`UsageIndicator`, billing): a perforated postage `.timbre` with the number in Plex Mono; packages are "pliegos".
6. **PDF** (`invoice-pdf-document.tsx`): same red folio and stamp block.

## Components and patterns
- `Combobox` (`shared/ui/combobox.tsx`): searchable select for clients (name + RFC), SAT keys (allows typing any 8-digit code), payment form, uso CFDI, régimen.
- Segmented choices (PUE/PPD, precios con/sin IVA, status filters): small buttons with `role="radio"`, selected = `bg-sello-tenue`.
- Empty states show the blank document they'll become (e.g. "Nº 0001 · Tu talonario está en blanco") with one specific CTA.
- Errors: `RouteError` (`shared/components/route-error.tsx`) says what failed and that data was not modified.
- Navigation: one list in `shared/components/nav-config.ts` (Inicio, Facturas, Clientes, Timbres, Mis datos fiscales); active item = sheet + stamp-blue tab on the edge.

## Copy
Spanish, sentence case, plain verbs, tú. Buttons say what happens ("Guardar y timbrar", "Comprar timbres"). Errors explain what happened and how to fix it; no apologies, no emojis.
