# FacturaFast - ROADMAP

**Actualizado:** 2026-03-30 (v3)
**Strategy:** Launch Early Access sin beta users externos

---

## ✅ COMPLETADO (Ya implementado en el repo)

### Infraestructura & Auth
- ✅ Next.js 16 + React 19 + TypeScript strict mode
- ✅ Tailwind CSS 4 + Shadcn/ui design system (Cal.com aesthetic)
- ✅ Clerk Auth — sign-in/sign-up con tema custom emerald, dark/light sync
- ✅ Neon PostgreSQL + Drizzle ORM + migraciones
- ✅ Screaming Architecture (feature-based)
- ✅ Path aliases (@features, @shared, @database)
- ✅ `.env.example` con todas las variables documentadas

### Database Schemas (Drizzle)
- ✅ `clients` — catálogo de receptores con soft delete
- ✅ `invoices` — facturas con UUID, sellos, cancelación, acuse
- ✅ `issuing_profiles` — multi-RFC emisores con CSD
- ✅ `sat_catalogs` — catálogos SAT (formas pago, usos CFDI, etc.)
- ✅ `subscriptions` — planes, uso de timbres, IDs de Conekta
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

### Feature: Invoicing
- ✅ CRUD completo (create, update, delete)
- ✅ Invoice detail page `/invoices/[id]` con help dialog contextual
- ✅ Edit flow `/invoices/[id]/edit`
- ✅ PDF preview con @react-pdf/renderer (R2 si existe, fallback al vuelo)
- ✅ Cálculos automáticos IVA 16% (incluyendo IVA incluido)
- ✅ Tabla con búsqueda, column headers y menú de acciones rápidas (...)
- ✅ StatusBadge compartido (draft/timbrada/cancelada)
- ✅ Descargar XML (archivo) + PDF (nueva ventana) desde R2

### Feature: Stamping (Timbrado PAC)
- ✅ SW Sapien PAC integration (sandbox probado)
- ✅ `cfdi-xml-builder.service.ts` — construye CFDI XML 4.0
- ✅ `xml-seal.service.ts` — sella XML con certificado
- ✅ `sw-client.service.ts` — cliente HTTP SW Sapien
- ✅ Botón "Timbrar" con spinner + error handling
- ✅ Post-timbrado: genera PDF server-side → upload XML+PDF a R2 → guarda URLs en DB
- ✅ Check de límites de plan antes de timbrar + incremento post-timbrado

### Feature: Cancelación CFDI
- ✅ CancelInvoiceDialog con motivo SAT (01-04) + UUID sustitución
- ✅ Cancelación vía SW Sapien PAC
- ✅ Acuse de cancelación guardado en R2 + botón de descarga
- ✅ Acciones de descarga disponibles para facturas canceladas (XML, PDF, Acuse)

### Feature: Storage (Cloudflare R2)
- ✅ Bucket `facturafast-invoices` creado + CORS configurado
- ✅ `r2.service.ts` — upload, signed URLs, delete
- ✅ `pdf-generator.service.ts` — genera PDF server-side con renderToBuffer
- ✅ Descarga XML como archivo, PDF en nueva ventana, Acuse como archivo

### Feature: Billing (Conekta)
- ✅ Schema `subscriptions` en DB
- ✅ Planes: Free (5 timbres), Starter $79 (30), Pro $179 (100), Business $449 (∞)
- ✅ Planes creados en Conekta dashboard (test)
- ✅ `subscription.service.ts` — getOrCreate, checkUsage, increment, activate, renew, cancel
- ✅ `conekta.service.ts` — createCustomer, createCheckoutOrder
- ✅ Checkout hosted (redirect a Conekta) con tarjeta, OXXO, SPEI
- ✅ Webhook handler `/api/webhooks/conekta` (order.paid, subscription.paid/failed/canceled)
- ✅ Middleware permite webhook sin auth
- ✅ conektaCustomerId se guarda en DB antes del redirect (no se pierde si webhook falla)
- ✅ Cancelar suscripción desde UI (vuelve a Free)
- ✅ Billing page `/billing` con plan cards, resumen de uso, banners success/error
- ✅ Usage indicator en sidebar (desktop + mobile) con datos reales de DB
- ✅ Plan usage banner en dashboard con datos reales

### Dashboard & UI
- ✅ Dashboard con analytics + plan usage banner
- ✅ Dark/Light mode toggle (next-themes)
- ✅ Sidebar + mobile sidebar con usage indicator
- ✅ Responsive design
- ✅ Help dialog contextual por estado de factura
- ✅ Dropdown menu de acciones en listado de facturas
- ✅ Un componente por archivo (regla de proyecto)

---

## 🔴 PENDIENTE PARA PROBAR — Testing del flujo completo

### Testing Conekta (prioridad 1) ✅ COMPLETADO
- [x] **Configurar ngrok / Vercel** — Webhook funcional en producción
- [x] **Registrar webhook URL en Conekta** — Configurado en dashboard
- [x] **Test happy path** — Elegir plan → Pagar → Webhook activa plan
- [x] **Verificar en DB** — subscription.plan cambia, stampsUsed resetea a 0
- [x] **Test límite de timbres** — Bloqueo + toast con botón Upgrade
- [x] **Test cancelar suscripción** — Cancelar → vuelve a Free

### Testing Timbrado + R2 (prioridad 2) ✅ COMPLETADO
- [x] **Happy path** — Crear factura → Timbrar → XML+PDF en R2 → Descargar
- [x] **Cancelar factura** — Cancelar timbrada → Acuse en R2 → Descargar acuse
- [x] **Error cases** — Mensajes de error verificados
- [x] **Mobile** — Flujo completo funcional en mobile

---

## 🟡 NECESARIO PARA LAUNCH (pero no blocker)

### Notificaciones ✅ COMPLETADO
- [x] **Email (Resend)** — Post-timbrado, enviar XML + PDF al receptor
  - Template react-email profesional (layout, header, footer, invoice summary)
  - XML + PDF adjuntos automáticamente
  - Dialog de confirmación antes de timbrar (irreversible + timbre + email)

### UX & Polish
- [ ] Error handling exhaustivo (error boundaries)
- [ ] Loading states en todas las acciones críticas
- [ ] Onboarding wizard (signup → fiscal profile → primera factura)

### Monitoring
- [ ] Sentry setup
- [ ] PostHog analytics

### Legal & Marketing
- [ ] Landing page (Hero + Features + Pricing + FAQ)
- [ ] Legal pages (T&C, Privacy)

---

## 💰 PRICING (Early Access) — ver `docs/PRICING.md`

```
Free Tier (Siempre gratis):
✅ 5 timbres/mes
✅ Clientes ilimitados
✅ Sin tarjeta de crédito

Starter — $79 MXN/mes (50% OFF, regular $149):
✅ 30 timbres/mes
✅ Clientes ilimitados
✅ Soporte por email

Pro — $179 MXN/mes (50% OFF, regular $349):  ★ Recomendado
✅ 100 timbres/mes
✅ Clientes ilimitados
✅ Soporte prioritario

Business — $449 MXN/mes (50% OFF, regular $899):
✅ Ilimitado
✅ Soporte dedicado
```

**Early Adopter Promise:** Primeros 100 usuarios mantienen precio para siempre.
**Procesador:** Conekta (tarjeta, OXXO, SPEI) — ver `docs/CONEKTA-TEST.md`

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
- WhatsApp notifications (Twilio)
- Multi-user / equipos
- Role-based access
- Reportes & analytics avanzados
- Exportar a Excel
- Verificación de firma RSA en webhook de Conekta

---

**Approach:** Build fast, launch early, iterate con usuarios reales.
**Risk mitigation:** Free tier + badge "Beta" + soporte rápido.
**Upside:** Revenue real, feedback real, validación real.

Let's ship it. 🚀
