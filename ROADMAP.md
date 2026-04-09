# FacturaFast - ROADMAP

**Actualizado:** 2026-04-07 (v4)
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

### Feature: Billing (Conekta) — Paquetes de Timbres
- ✅ Refactor completo: suscripción mensual → paquetes de timbres sin vencimiento
- ✅ Schema `accounts` (reemplaza `subscriptions`) con `stampsBalance`, `totalStampsPurchased`, `totalStampsUsed`
- ✅ Schema `stamp_purchases` — historial de compras para auditoría
- ✅ 3 timbres de bienvenida al crear cuenta (no se renuevan)
- ✅ Paquetes: Starter $99 (20), Básico $199 (50), Pro $499 (150), Business $899 (300)
- ✅ `account.service.ts` — getOrCreateAccount, checkStampsBalance, consumeStamp, addStamps, getPurchaseHistory
- ✅ `conekta.service.ts` — createCustomer, createCheckoutOrder con packageId
- ✅ Checkout hosted (redirect a Conekta) con tarjeta, OXXO, SPEI
- ✅ Webhook handler `/api/webhooks/conekta` — solo `order.paid` → addStamps
- ✅ Middleware permite webhook sin auth
- ✅ conektaCustomerId se guarda en DB antes del redirect
- ✅ Billing page `/billing` con grid de paquetes, saldo prominente, historial de compras
- ✅ `package-card.tsx` — muestra paquete con badge "Recomendado" en Pro
- ✅ `purchase-history.tsx` — tabla de historial de compras
- ✅ Usage indicator en sidebar (desktop + mobile) — muestra saldo de timbres
- ✅ Stamps banner en dashboard — alerta cuando saldo < 10
- ✅ Eliminado: planes mensuales, cancelación de suscripción, renovación, periodos

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
- [x] **Test happy path** — Elegir paquete → Pagar → Webhook suma timbres
- [x] **Verificar en DB** — stampsBalance incrementa correctamente
- [x] **Test límite de timbres** — Bloqueo + toast con botón Recargar

### Testing Timbrado + R2 (prioridad 2) ✅ COMPLETADO
- [x] **Happy path** — Crear factura → Timbrar → XML+PDF en R2 → Descargar
- [x] **Cancelar factura** — Cancelar timbrada → Acuse en R2 → Descargar acuse
- [x] **Error cases** — Mensajes de error verificados
- [x] **Mobile** — Flujo completo funcional en mobile

---

## 🔴 PENDIENTE PARA PROBAR — Testing paquetes de timbres

### Testing Paquetes (nuevo flujo)
- [ ] **Test compra paquete** — Seleccionar paquete → Checkout Conekta → Webhook suma timbres al saldo
- [ ] **Test acumulación** — Comprar dos paquetes → saldo se suma correctamente
- [ ] **Historial de compras** — Verificar que aparece en la tabla de purchase-history
- [ ] **Migración DB** — Ejecutar `pnpm db:push` con el nuevo schema accounts + stamp_purchases
- [ ] **Crear productos en Conekta** — Configurar los 4 productos/paquetes en el dashboard de Conekta

---

## 🟡 NECESARIO PARA LAUNCH (pero no blocker)

### Notificaciones ✅ COMPLETADO
- [x] **Email (Resend)** — Post-timbrado, enviar XML + PDF al receptor
  - Template react-email profesional (layout, header, footer, invoice summary)
  - XML + PDF adjuntos automáticamente
  - Dialog de confirmación antes de timbrar (irreversible + timbre + email)

### UX & Polish
- [x] Error boundaries en todas las rutas del dashboard
- [x] Loading skeletons en todas las páginas (billing, clients, dashboard, invoices, fiscal-profiles)
- [ ] Onboarding wizard (signup → fiscal profile → primera factura)

### Monitoring
- [ ] Sentry setup
- [ ] PostHog analytics

### Legal & Marketing
- [ ] Landing page (Hero + Features + Pricing + FAQ)
- [ ] Legal pages (T&C, Privacy)

---

## 💰 PRICING — Paquetes de Timbres (sin vencimiento)

```
Bienvenida (al crear cuenta):
✅ 3 timbres gratis (una sola vez)
✅ Clientes ilimitados
✅ Sin tarjeta de crédito

Starter — $99 MXN (20 timbres, $4.95/timbre):
✅ Clientes ilimitados
✅ Descarga XML + PDF
✅ Soporte por email

Básico — $199 MXN (50 timbres, $3.98/timbre):
✅ Clientes ilimitados
✅ Descarga XML + PDF
✅ Soporte por email

Pro — $499 MXN (150 timbres, $3.33/timbre):  ★ Recomendado
✅ Clientes ilimitados
✅ Descarga XML + PDF
✅ Soporte prioritario

Business — $899 MXN (300 timbres, $3.00/timbre):
✅ Clientes ilimitados
✅ Descarga XML + PDF
✅ Soporte dedicado
```

**Modelo:** Compra única, sin suscripción. Los timbres nunca vencen y se acumulan.
**Procesador:** Conekta (tarjeta, OXXO, SPEI)

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
- Paquetes personalizados / volumen para empresas grandes

---

**Approach:** Build fast, launch early, iterate con usuarios reales.
**Risk mitigation:** Free tier + badge "Beta" + soporte rápido.
**Upside:** Revenue real, feedback real, validación real.

Let's ship it. 🚀
