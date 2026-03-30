# FacturaFast - ROADMAP

**Actualizado:** 2026-03-30 (v2)  
**Strategy:** Launch Early Access sin beta users externos

---

## ✅ COMPLETADO (Ya implementado en el repo)

### Infraestructura & Auth
- ✅ Next.js 16 + React 19 + TypeScript strict mode
- ✅ Tailwind CSS 4 + Shadcn/ui design system (Cal.com aesthetic)
- ✅ Clerk Auth — sign-in/sign-up con tema custom emerald, dark/light sync
- ✅ Supabase (Postgres + Auth + Storage) integrado
- ✅ Drizzle ORM + migraciones
- ✅ Screaming Architecture (feature-based)
- ✅ Path aliases (@features, @shared, @database)

### Database Schemas (Drizzle)
- ✅ `clients` — catálogo de receptores con soft delete
- ✅ `invoices` — facturas con UUID, sellos, cancelación
- ✅ `issuing_profiles` — multi-RFC emisores con CSD
- ✅ `sat_catalogs` — catálogos SAT (formas pago, usos CFDI, etc.)
- ✅ Seeds para catálogos SAT

### Feature: Clients
- ✅ CRUD completo (create, update, soft delete)
- ✅ Búsqueda por RFC / nombre
- ✅ Validación RFC con regex
- ✅ Confirmation dialog para delete
- ✅ Toast notifications (sonner)

### Feature: Fiscal Profile (Perfil Emisor)
- ✅ Multi-RFC — múltiples perfiles emisores por usuario
- ✅ Upload .cer + .key (CSD)
- ✅ CSD status badge + default badge
- ✅ IssuingProfilePicker (dialog para seleccionar RFC al crear factura)
- ✅ CRUD completo (create, update, set default, delete)
- ✅ Cascade default promotion al eliminar perfil default
- ✅ `/dashboard/fiscal-profiles` route

### Feature: Invoicing
- ✅ CRUD completo (create, update, delete)
- ✅ Invoice detail page `/invoices/[id]`
- ✅ Edit flow `/invoices/[id]/edit`
- ✅ PDF preview con @react-pdf/renderer (modal + download)
- ✅ Cálculos automáticos IVA 16% (incluyendo IVA incluido)
- ✅ Tabla con búsqueda y column headers
- ✅ Modelo extendido: UUID, SAT cert number, sellos, fechas timbrado

### Feature: Stamping (Timbrado PAC)
- ✅ SW Sapien PAC integration (producción)
- ✅ `cfdi-xml-builder.service.ts` — construye CFDI XML CFDI 4.0
- ✅ `xml-seal.service.ts` — sella XML con certificado
- ✅ `sw-client.service.ts` — cliente HTTP SW Sapien
- ✅ Cancelación CFDI implementada
- ✅ Error handling en timbrado

### Feature: Notifications
- ✅ Mock service para desarrollo (sin APIs reales)

### Dashboard & UI
- ✅ Dashboard con analytics básico
- ✅ Dark/Light mode toggle (next-themes)
- ✅ Sidebar + mobile sidebar
- ✅ Responsive design
- ✅ SAT catalogs service con opciones detalladas de uso CFDI

---

## 🔴 CRITICAL PATH — Sin esto NO hay launch

### Storage (Cloudflare R2) — decisión confirmada
- [x] **Configurar bucket R2** — Bucket `facturafast-invoices` creado + CORS configurado
- [x] **Instalar AWS SDK** — `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` instalados
- [x] **r2.service.ts** — `features/storage/services/r2.service.ts` con uploadFile, getFileSignedUrl, deleteFiles
- [x] **Columnas en DB** — `xmlUrl` + `pdfUrl` ya existían en schema
- [x] **Flujo post-timbrado** — Integrado en `stampInvoice`: PAC → save DB → genera PDF server-side → upload XML+PDF a R2 → guarda keys en DB
- [x] **pdf-generator.service.ts** — Genera PDF server-side con `renderToBuffer` reutilizando `InvoicePdfDocument`
- [x] **Descarga desde R2** — Botones XML/PDF con signed URLs + fallback a xmlContent en memoria
- [x] **Credenciales R2** — Configuradas en `.env.local`

### Timbrado flow completo — UI → PAC → R2 → DB
- [x] **Timbrado funcional en sandbox** — Factura timbrada exitosamente vía SW Sapien (sandbox) ✅
- [x] **Botón "Timbrar"** en invoice detail con spinner + error handling
- [x] **Guardar en DB post-timbrado** — UUID, sello SAT, fechaTimbrado, xmlUrl, pdfUrl
- [x] **Estado visual** — Badges: Borrador / Timbrada / Cancelada
- [x] **Menú de acciones rápidas** en listado de facturas (descargar XML/PDF, copiar UUID, cancelar)

### Cancelación CFDI — UI
- [ ] **Botón "Cancelar"** en invoice detail (solo facturas timbradas) (1h)
  - Modal con motivo de cancelación (SAT requiere motivo)
  - Confirmar → llama al service que ya existe
  - Actualizar estado en DB

### Billing
- [ ] **Stripe integration** — Checkout + webhooks (3h)
  - Free tier: 10 facturas/mes
  - Starter / Pro / Business
- [ ] **Usage limits** — Check límites por plan antes de timbrar (2h)
  - Columna `invoicesThisMonth` en users o query COUNT
  - Bloquear timbrado si superó plan + prompt de upgrade

### Notificaciones
- [ ] **Email (Resend)** — Post-timbrado, enviar XML + PDF al receptor (2h)
  - Template HTML profesional
  - Adjuntar XML + link de descarga PDF desde R2

---

## 🟡 NECESARIO PARA LAUNCH (pero no blocker)

### UX & Polish
- [ ] Error handling exhaustivo (error boundaries) (2h)
- [ ] Loading states en todas las acciones críticas (1h)
- [ ] Onboarding wizard (signup → fiscal profile → primera factura) (3h)
- [ ] Search & filters en lista de facturas (1h)

### Monitoring
- [ ] Sentry setup (1h)
- [ ] PostHog analytics (1h)

### Legal & Marketing
- [ ] Landing page (Hero + Features + Pricing + FAQ) (3-4h)
- [ ] Legal pages (T&C, Privacy) (1h)

---

## 📅 PLAN DE EJECUCIÓN (Semana restante)

### Día 1 — R2 + Timbrado UI
- [ ] Configurar R2 (Cloudflare dashboard + credenciales)
- [ ] `r2.service.ts` + columnas en DB
- [ ] Botón "Timbrar" + flujo completo (UI → PAC → R2 → DB)
- [ ] Estado visual Borrador/Timbrada/Cancelada

### Día 2 — Cancelación + Billing
- [ ] Cancelación CFDI desde UI
- [ ] Stripe integration + usage limits

### Día 3 — Notifications + Polish
- [ ] Email (Resend) post-timbrado
- [ ] Error handling + loading states
- [ ] Onboarding wizard

### Día 4 — TESTING DAY 🧪
- [ ] Happy path: signup → CSF → cliente → factura → timbrar
- [ ] Error cases: RFC inválido, cert equivocado, PAC fail
- [ ] Edge cases: precios con IVA incluido, importes extremos
- [ ] Billing: free tier → upgrade → límites
- [ ] Mobile: iOS + Android
- [ ] Fix ALL critical bugs
- [ ] Re-test hasta 0 blockers

### Día 5 — Pre-launch
- [ ] Landing page + legal pages
- [ ] Sentry + PostHog
- [ ] Rate limiting + security review
- [ ] Final deploy + smoke test en producción
- [ ] Materiales de launch (tweets, posts)

### Día 6 — 🚀 LAUNCH
- [ ] Publicar landing
- [ ] Early Access con 50% OFF (primeros 100 usuarios precio permanente)
- [ ] Tweet + LinkedIn + communities (r/mexico, grupos Facebook)
- [ ] Product Hunt (opcional)

### Día 7 — Post-launch
- [ ] Monitor bugs y support
- [ ] Fix críticos ASAP
- [ ] Engage early users

---

## 💰 PRICING (Early Access)

```
Free Tier (Siempre gratis):
✅ 10 facturas timbradas/mes
✅ 5 clientes
✅ Sin tarjeta de crédito

Starter — $99 MXN/mes (50% OFF, regular $199):
✅ 50 facturas/mes
✅ Clientes ilimitados
✅ Email support

Pro — $199 MXN/mes (50% OFF, regular $399):
✅ 200 facturas/mes
✅ Priority support
✅ WhatsApp notifications

Business — $499 MXN/mes (50% OFF, regular $999):
✅ Ilimitado
✅ Dedicated support
```

**Early Adopter Promise:** Primeros 100 usuarios mantienen precio para siempre.

---

## 📊 SUCCESS METRICS (Semana 1 Post-launch)

```
Signups:              10+ (realista)
Paying users:         1-3 (realista)
Facturas timbradas:   20+ (todos los usuarios)
Critical bugs:        0
Support response:     <4h
Uptime:               99.9%
```

---

## 🎯 POST-LAUNCH (Semana 3+)

- Fix bugs de usuarios reales
- Mejorar onboarding según drop-off analytics
- WhatsApp notifications (Twilio) — pospuesto a post-launch
- Multi-user / equipos
- Role-based access
- Reportes & analytics avanzados
- Exportar a Excel

---

**Approach:** Build fast, launch early, iterate con usuarios reales.  
**Risk mitigation:** Free tier + badge "Beta" + soporte rápido.  
**Upside:** Revenue real, feedback real, validación real.

Let's ship it. 🚀
