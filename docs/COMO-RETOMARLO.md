# 🔄 Cómo Retomar FacturaFast

> Guía para retomar el desarrollo desde donde quedó.

**Última actualización:** 2026-03-18  
**Estado actual:** UI + Services listos con mock data — falta infraestructura (Neon + Clerk) y timbrado real

---

## 📊 ¿Dónde quedó exactamente?

El proyecto está **~40% completo**. Lo que hay funciona, pero con datos ficticios.

### ✅ Listo
- Arquitectura completa (Screaming Architecture)
- Schemas Drizzle (clientes, facturas, items)
- Services: `InvoiceService` (5 funciones) + `ClientService` (7 funciones)
- Server Actions (Next.js)
- UI completa: Dashboard, /facturas, /clientes, formularios con validación
- Design system (Cal.com inspired, Tailwind 4 + Shadcn/ui)
- Cálculos de IVA 16%

### ❌ Falta (bloqueantes para producción)
1. **Neon** (base de datos real) — actualmente sin conexión
2. **Clerk** (autenticación) — hay `'temp-user-id'` hardcodeado en todo
3. **Timbrado CFDI** — XML + PAC (Finkok/SW Sapien)
4. **R2 Storage** — guardar XMLs y PDFs
5. **Stripe** — billing y suscripciones

---

## 🚀 Pasos para retomar (en orden)

### PASO 1 — Levantar entorno local (5 min)

```bash
cd /media/esteban-qs/Ventures/facturafast
npm install
cp .env.example .env.local  # si existe, si no crear desde STACK.md
npm run dev
# Abre: http://localhost:3000
```

> Si no hay `.env.example`, revisar `STACK.md` para saber qué variables necesitas.

---

### PASO 2 — Conectar Neon (base de datos real) ~15 min

1. Ir a https://neon.tech y crear proyecto (gratis)
2. Copiar el `DATABASE_URL` de conexión
3. Agregarlo a `.env.local`:
   ```
   DATABASE_URL="postgresql://..."
   ```
4. Correr migraciones:
   ```bash
   npm run db:push
   # o
   npx drizzle-kit push
   ```
5. Verificar con Drizzle Studio:
   ```bash
   npx drizzle-kit studio
   ```

---

### PASO 3 — Conectar Clerk (auth) ~20 min

1. Ir a https://clerk.com y crear app
2. Copiar las keys al `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
3. Buscar todos los `'temp-user-id'` en el código y reemplazar:
   ```bash
   grep -r "temp-user-id" --include="*.ts" --include="*.tsx" .
   ```
4. Usar el helper `getCurrentUser()` en cada Server Action/Component
5. Verificar que el middleware protege las rutas (ver `middleware.ts`)

---

### PASO 4 — Deploy en Vercel ~10 min

```bash
# Instalar Vercel CLI si no está
npm install -g vercel

vercel
# Seguir el wizard, agregar las env vars
```

Con esto ya tienes un MVP funcional (sin timbrado real aún).

---

### PASO 5 — Timbrado CFDI (el core del negocio) ~6-8h

Este es el paso más complejo. Revisar el estado actual:
```bash
ls features/timbrado/
```

**Pasos:**
1. **Registrarse en Finkok sandbox:** https://finkok.com (o SW Sapien)
2. **Obtener CSD de prueba SAT:**
   - https://pruebas.sat.gob.mx/tramitesyservicios/Paginas/certificado_sello_digital.htm
   - Necesitas: `.cer`, `.key`, y contraseña del `.key`
3. **Instalar librería para XML CFDI 4.0:**
   ```bash
   npm install @nodecfdi/cfdi-core @nodecfdi/cfdi-validator
   ```
4. **Implementar generación de XML** en `features/timbrado/`
5. **Implementar llamada al PAC** para timbrar
6. **Guardar UUID + XML + PDF** en R2 Storage

---

### PASO 6 — R2 Storage (Cloudflare) ~30 min

1. Crear bucket en https://dash.cloudflare.com → R2
2. Agregar credenciales a `.env.local`:
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_NAME=facturafast
   ```
3. El código de storage ya debería estar en `features/` o `lib/`

---

### PASO 7 — Stripe (billing) ~3h

1. Crear cuenta en https://stripe.com (o usar cuenta existente)
2. Crear productos/precios en el dashboard
3. Agregar env vars:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Implementar checkout + webhook para activar planes

---

## 📋 Checklist de retoma rápida

```
[ ] npm install && npm run dev (¿levanta sin errores?)
[ ] Crear proyecto en Neon y conectar DB
[ ] Crear app en Clerk y conectar auth
[ ] Deploy básico en Vercel
[ ] Reemplazar 'temp-user-id' con Clerk real
[ ] Test manual: crear cliente + crear factura
[ ] Iniciar integración de timbrado CFDI
```

---

## 📁 Archivos clave del proyecto

| Archivo/Carpeta | Qué tiene |
|-----------------|-----------|
| `STATUS.md` | Estado detallado al 2026-02-28 |
| `ROADMAP.md` | Plan de 2 semanas para lanzar |
| `STACK.md` | Setup de Neon + Clerk + R2 |
| `ARCHITECTURE.md` | Guía de arquitectura completa |
| `features/invoicing/` | Core de facturación |
| `features/timbrado/` | Integración PAC (pendiente) |
| `features/clients/` | Gestión de clientes |
| `database/` | Schemas Drizzle |
| `middleware.ts` | Auth middleware (Clerk) |

---

## ⚡ Ruta mínima para tener algo funcional

Si quieres el camino más corto:

```
Neon (15 min) → Clerk (20 min) → Vercel (10 min) = MVP con datos reales, sin timbrado
```

Después agregar timbrado CFDI para que sea un producto vendible.

---

## 🔗 Recursos

- [Neon Docs](https://neon.tech/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Finkok API Docs](https://finkok.com/documentacion)
- [nodecfdi (generación XML)](https://nodecfdi.github.io/)
- [Catálogos SAT CFDI 4.0](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm)
- [Validador CFDI SAT](https://verificacfdi.facturaelectronica.sat.gob.mx/)
