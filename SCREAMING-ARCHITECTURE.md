# FacturaFast - Screaming Architecture

## 🏗️ Filosofía

"La arquitectura debe gritar el propósito del sistema, no el framework usado"
— Robert C. Martin (Uncle Bob)

Cuando alguien ve la estructura, debe entender inmediatamente:
**"Este es un sistema de FACTURACIÓN ELECTRÓNICA"**

No: "Esta es una app Next.js con Supabase"

---

## 📁 Estructura Propuesta

```
facturafast/
├── app/                           # Next.js App Router (infraestructura)
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│
├── features/                      # 🎯 BUSINESS LOGIC (grita el propósito)
│   ├── invoicing/                # Facturación CFDI
│   │   ├── components/
│   │   │   ├── invoice-form.tsx
│   │   │   ├── invoice-list.tsx
│   │   │   ├── invoice-card.tsx
│   │   │   └── invoice-details.tsx
│   │   ├── services/
│   │   │   ├── invoice.service.ts
│   │   │   ├── xml-generator.service.ts
│   │   │   └── pdf-generator.service.ts
│   │   ├── hooks/
│   │   │   ├── use-invoice.ts
│   │   │   └── use-invoice-list.ts
│   │   ├── types/
│   │   │   └── invoice.types.ts
│   │   └── utils/
│   │       ├── invoice-calculations.ts
│   │       └── folio-generator.ts
│   │
│   ├── clients/                  # Catálogo de clientes
│   │   ├── components/
│   │   │   ├── client-form.tsx
│   │   │   ├── client-list.tsx
│   │   │   └── client-selector.tsx
│   │   ├── services/
│   │   │   └── client.service.ts
│   │   ├── hooks/
│   │   │   └── use-clients.ts
│   │   └── types/
│   │       └── client.types.ts
│   │
│   ├── fiscal-profile/           # Perfil fiscal (CSF)
│   │   ├── components/
│   │   │   ├── csf-upload.tsx
│   │   │   ├── fiscal-profile-form.tsx
│   │   │   └── certificate-manager.tsx
│   │   ├── services/
│   │   │   ├── fiscal-profile.service.ts
│   │   │   └── csf-extractor.service.ts
│   │   ├── hooks/
│   │   │   └── use-fiscal-profile.ts
│   │   └── types/
│   │       └── fiscal-profile.types.ts
│   │
│   ├── timbrado/                 # Timbrado CFDI (PAC integration)
│   │   ├── services/
│   │   │   ├── pac.service.ts
│   │   │   └── pac-mock.service.ts
│   │   └── types/
│   │       └── timbrado.types.ts
│   │
│   ├── notifications/            # Notificaciones (WhatsApp, Email)
│   │   ├── services/
│   │   │   ├── notification.service.ts
│   │   │   ├── whatsapp.service.ts
│   │   │   └── email.service.ts
│   │   └── types/
│   │       └── notification.types.ts
│   │
│   └── dashboard/                # Analytics & Overview
│       ├── components/
│       │   ├── stats-card.tsx
│       │   ├── revenue-chart.tsx
│       │   └── recent-activity.tsx
│       └── hooks/
│           └── use-dashboard-stats.ts
│
├── shared/                        # Código compartido (no específico del dominio)
│   ├── ui/                       # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── badge.tsx
│   ├── components/               # Componentes compartidos
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── page-header.tsx
│   │   └── common/
│   │       ├── loading-spinner.tsx
│   │       └── error-boundary.tsx
│   ├── hooks/                    # React hooks compartidos
│   │   ├── use-auth.ts
│   │   └── use-toast.ts
│   ├── utils/                    # Utilidades generales
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── types/                    # Types compartidos
│       └── common.types.ts
│
├── database/                      # Database layer (Drizzle ORM)
│   ├── schemas/
│   │   ├── invoices.schema.ts
│   │   ├── clients.schema.ts
│   │   └── fiscal-profile.schema.ts
│   ├── migrations/
│   └── client.ts
│
├── config/                        # Configuration
│   ├── sat-catalogs.ts           # Catálogos SAT (CFDI 4.0)
│   ├── app.config.ts
│   └── env.ts
│
└── types/                         # Global TypeScript types
    └── globals.d.ts
```

---

## 🎯 Beneficios de Screaming Architecture

### 1. **El Propósito es Obvio**
Alguien nuevo al proyecto ve:
```
features/
  invoicing/      ← "Este sistema crea facturas"
  clients/        ← "Gestiona clientes"
  timbrado/       ← "Timbra CFDI"
  fiscal-profile/ ← "Maneja perfil fiscal"
```

**No necesita documentación para entender el dominio.**

### 2. **Organización por Feature (Vertical Slicing)**
Cada feature es autónoma:
```
invoicing/
  ├── components/  ← UI de facturas
  ├── services/    ← Lógica de negocio
  ├── hooks/       ← React hooks
  ├── types/       ← Types específicos
  └── utils/       ← Utilidades del dominio
```

Todo lo relacionado con **facturación** está en un solo lugar.

### 3. **Separation of Concerns**
- `features/` → **DOMINIO** (facturación, clientes, timbrado)
- `shared/` → **INFRAESTRUCTURA** (UI, utils, componentes genéricos)
- `app/` → **ROUTING** (Next.js specifics)
- `database/` → **PERSISTENCIA** (Drizzle schemas)

### 4. **Fácil de Escalar**
Agregar nueva feature = agregar carpeta en `features/`:
```
features/
  ├── invoicing/
  ├── clients/
  ├── reports/     ← NUEVO: Reportes contables
  └── payments/    ← NUEVO: Gestión de pagos
```

### 5. **Testeable**
Cada feature es independiente:
```
features/invoicing/__tests__/
  ├── invoice.service.test.ts
  ├── invoice-calculations.test.ts
  └── xml-generator.test.ts
```

---

## 🔄 Migration Path

### Phase 1: Reestructurar Features ✅
```bash
mkdir -p features/{invoicing,clients,fiscal-profile,timbrado,notifications,dashboard}
```

### Phase 2: Mover Services
```bash
# De lib/services/ a features/*/services/
mv lib/services/invoice-service.ts features/invoicing/services/
mv lib/services/client-service.ts features/clients/services/
```

### Phase 3: Mover Components
```bash
# Crear components específicos por feature
features/invoicing/components/invoice-form.tsx
features/clients/components/client-list.tsx
```

### Phase 4: Shared → Infraestructura
```bash
# Mover components/ui/ a shared/ui/
mv components/ui shared/ui
```

### Phase 5: Database Schemas
```bash
# Renombrar drizzle/ a database/
mv drizzle/ database/
```

---

## 📝 Import Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@/features/*": ["./features/*"],
      "@/shared/*": ["./shared/*"],
      "@/database/*": ["./database/*"],
      "@/config/*": ["./config/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

**Usage:**
```tsx
// Feature imports
import { InvoiceService } from '@/features/invoicing/services/invoice.service'
import { InvoiceForm } from '@/features/invoicing/components/invoice-form'

// Shared imports
import { Button } from '@/shared/ui/button'
import { useAuth } from '@/shared/hooks/use-auth'

// Database
import { db } from '@/database/client'
import { invoices } from '@/database/schemas/invoices.schema'
```

---

## ✅ Reglas de Arquitectura

### 1. **Features NO se importan entre sí**
```tsx
// ❌ MAL
import { ClientService } from '@/features/clients/services/client.service'
// dentro de features/invoicing/

// ✅ BIEN
// Si invoicing necesita clients, usar dependency injection o events
```

### 2. **Shared es agnóstico del dominio**
```tsx
// ❌ MAL en shared/
export function calculateInvoiceTotal() { }

// ✅ BIEN en features/invoicing/utils/
export function calculateInvoiceTotal() { }

// ✅ BIEN en shared/
export function formatCurrency() { }
```

### 3. **Database schemas reflejan el dominio**
```
database/schemas/
  ├── invoices.schema.ts      ← Facturación
  ├── clients.schema.ts       ← Clientes
  └── fiscal-profile.schema.ts ← Perfil Fiscal
```

### 4. **App Router es solo routing**
```tsx
// app/(dashboard)/facturas/page.tsx
import { InvoiceList } from '@/features/invoicing/components/invoice-list'

export default function FacturasPage() {
  return <InvoiceList />
}
```

No lógica de negocio en `app/`, solo orquestación.

---

## 🎯 Ejemplo Completo: Feature "Invoicing"

```
features/invoicing/
├── components/
│   ├── invoice-form.tsx          ← Formulario crear factura
│   ├── invoice-list.tsx          ← Lista de facturas
│   ├── invoice-card.tsx          ← Card individual
│   ├── invoice-details.tsx       ← Detalles completos
│   ├── invoice-status-badge.tsx  ← Badge de status
│   └── invoice-item-input.tsx    ← Input conceptos
│
├── services/
│   ├── invoice.service.ts        ← CRUD facturas
│   ├── xml-generator.service.ts  ← Generar XML CFDI
│   ├── pdf-generator.service.ts  ← Generar PDF
│   └── folio.service.ts          ← Auto-increment folios
│
├── hooks/
│   ├── use-invoice.ts            ← Single invoice hook
│   ├── use-invoice-list.ts       ← List hook
│   ├── use-create-invoice.ts     ← Mutation hook
│   └── use-timbrar.ts            ← Timbrado hook
│
├── types/
│   ├── invoice.types.ts          ← Invoice, InvoiceItem, etc.
│   └── cfdi.types.ts             ← CFDI 4.0 types
│
└── utils/
    ├── invoice-calculations.ts   ← Subtotal, IVA, Total
    ├── invoice-validators.ts     ← Validaciones CFDI
    └── sat-catalogos.ts          ← Helpers catálogos SAT
```

**Uso:**
```tsx
// app/(dashboard)/facturas/page.tsx
import { InvoiceList } from '@/features/invoicing/components/invoice-list'

export default function FacturasPage() {
  return (
    <div>
      <h1>Facturas</h1>
      <InvoiceList />
    </div>
  )
}

// features/invoicing/components/invoice-list.tsx
'use client'
import { useInvoiceList } from '../hooks/use-invoice-list'
import { InvoiceCard } from './invoice-card'

export function InvoiceList() {
  const { invoices, isLoading } = useInvoiceList()
  
  if (isLoading) return <Spinner />
  
  return (
    <div className="grid gap-4">
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  )
}
```

---

## 🚀 Next Steps

1. ✅ Crear estructura de carpetas
2. ✅ Mover Drizzle schemas → database/
3. ✅ Crear features/ (invoicing, clients, fiscal-profile)
4. ✅ Mover components/ui/ → shared/ui/
5. ✅ Actualizar imports
6. ✅ Configurar tsconfig paths

**Ready para implementar Rey?** 🏗️
