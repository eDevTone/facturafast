# FacturaFast - Architecture

## 🏗️ Screaming Architecture

**"La arquitectura debe gritar el propósito del sistema, no el framework usado"**
— Robert C. Martin (Uncle Bob)

Este proyecto usa **Screaming Architecture**: la estructura de carpetas revela inmediatamente que este es un **sistema de facturación electrónica CFDI**, no solo "otra app Next.js".

---

## 📁 Project Structure

```
facturafast/
│
├── 🎯 features/                      # DOMINIO DE NEGOCIO
│   ├── invoicing/                    # 📋 Facturación CFDI
│   │   ├── components/               # UI de facturas
│   │   ├── services/                 # Lógica negocio (CRUD, XML, PDF)
│   │   ├── hooks/                    # React hooks
│   │   ├── types/                    # TypeScript types
│   │   └── utils/                    # Utilidades (cálculos, validaciones)
│   │
│   ├── clients/                      # 👥 Catálogo de clientes
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── fiscal-profile/               # 🏢 Perfil fiscal (CSF)
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── timbrado/                     # ✅ Timbrado PAC
│   │   ├── services/
│   │   └── types/
│   │
│   ├── notifications/                # 📬 WhatsApp + Email
│   │   └── services/
│   │
│   └── dashboard/                    # 📊 Analytics
│       ├── components/
│       └── hooks/
│
├── 🔧 shared/                        # INFRAESTRUCTURA
│   ├── ui/                           # Shadcn/ui components
│   ├── components/                   # Componentes compartidos
│   │   ├── layout/                   # Navbar, Sidebar
│   │   └── common/                   # Spinner, ErrorBoundary
│   ├── hooks/                        # React hooks generales
│   ├── utils/                        # Utilidades generales
│   └── types/                        # Types compartidos
│
├── 🗄️ database/                      # CAPA DE DATOS
│   ├── schemas/                      # Drizzle ORM schemas
│   │   ├── invoices.schema.ts
│   │   ├── clients.schema.ts
│   │   └── fiscal-profile.schema.ts
│   ├── migrations/                   # SQL migrations
│   └── client.ts                     # DB client
│
├── ⚙️ config/                         # CONFIGURACIÓN
│   ├── sat-catalogs.ts               # Catálogos SAT
│   └── env.ts                        # Env validation
│
├── 📱 app/                            # NEXT.JS APP ROUTER
│   ├── (auth)/                       # Auth routes
│   ├── (dashboard)/                  # Dashboard routes
│   └── api/                          # API routes
│
└── 🔤 types/                          # GLOBAL TYPES
    └── globals.d.ts
```

---

## 🎯 Design Principles

### 1. **Feature-Based Organization (Vertical Slicing)**

Cada feature contiene todo lo que necesita:

```
features/invoicing/
├── components/      ← UI
├── services/        ← Logic
├── hooks/           ← Data fetching
├── types/           ← TypeScript
└── utils/           ← Helpers
```

**Beneficio:** Todo relacionado con FACTURAS está en un solo lugar.

### 2. **Separation of Concerns**

| Layer | Propósito | Ejemplo |
|-------|-----------|---------|
| **Features** | Dominio de negocio | Invoicing, Clients, Timbrado |
| **Shared** | Infraestructura reutilizable | UI components, hooks, utils |
| **Database** | Persistencia | Drizzle schemas, migrations |
| **App** | Routing | Next.js pages, API routes |
| **Config** | Configuración | SAT catalogs, env vars |

### 3. **Dependency Rules**

```
features/invoicing/
  ✅ Can import from: shared/, database/, config/
  ❌ Cannot import from: other features/
  
shared/
  ✅ Can import from: Nothing (standalone)
  ❌ Cannot import from: features/, app/
```

**Excepción:** Features pueden comunicarse via events o dependency injection.

### 4. **Import Aliases**

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

// Config
import { SAT_REGIMENES } from '@/config/sat-catalogs'
```

---

## 🔄 Data Flow Example: Crear Factura

```
User clicks "Nueva Factura"
        ↓
app/(dashboard)/facturas/nueva/page.tsx
        ↓
features/invoicing/components/invoice-form.tsx
        ↓
features/invoicing/hooks/use-create-invoice.ts
        ↓
features/invoicing/services/invoice.service.ts
        ↓
database/schemas/invoices.schema.ts (Drizzle ORM)
        ↓
PostgreSQL (Supabase)
        ↓
Success → Timbrar CFDI
        ↓
features/timbrado/services/pac.service.ts
        ↓
PAC API (Finkok / SW Sapien)
        ↓
UUID recibido
        ↓
features/invoicing/services/xml-generator.service.ts
        ↓
features/invoicing/services/pdf-generator.service.ts
        ↓
Supabase Storage (XML + PDF)
        ↓
features/notifications/services/notification.service.ts
        ↓
WhatsApp + Email al cliente
```

---

## 🧩 Core Features

### 1. **Invoicing** (Facturación)
- CRUD de facturas
- Generación XML CFDI 4.0
- Generación PDF
- Timbrado con PAC
- Cancelación CFDI
- Cálculos automáticos (IVA, retenciones)

### 2. **Clients** (Clientes)
- Catálogo de receptores
- Búsqueda por RFC
- Validación RFC

### 3. **Fiscal Profile** (Perfil Fiscal)
- Datos del emisor
- Upload CSF (auto-extracción)
- Gestión certificados (.cer, .key)

### 4. **Timbrado** (PAC Integration)
- Mock service (desarrollo)
- Finkok integration (producción)
- SW Sapien (alternativa)

### 5. **Notifications**
- WhatsApp (Twilio)
- Email (Resend)
- Mock service (desarrollo)

### 6. **Dashboard**
- Analytics
- Recent activity
- Revenue charts

---

## 🛠️ Tech Stack

### Core
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Components:** Shadcn/ui
- **Icons:** Lucide React

### Database
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth

### Libraries
- **Forms:** React Hook Form + Zod
- **PDF:** jsPDF
- **HTTP:** Axios

### Development
- **Mock Services:** PAC, Notifications (development)
- **Real Services:** Configured for production swap

---

## 🚀 Development Workflow

### 1. Add New Feature

```bash
# Create feature structure
mkdir -p features/my-feature/{components,services,hooks,types,utils}

# Add README
echo "# Feature: My Feature" > features/my-feature/README.md
```

### 2. Add Business Logic

```typescript
// features/my-feature/services/my-feature.service.ts
export class MyFeatureService {
  static async create() { }
  static async update() { }
  static async delete() { }
}
```

### 3. Add UI Components

```tsx
// features/my-feature/components/my-feature-form.tsx
import { Button } from '@/shared/ui/button'
import { MyFeatureService } from '../services/my-feature.service'

export function MyFeatureForm() {
  // ...
}
```

### 4. Add React Hooks

```typescript
// features/my-feature/hooks/use-my-feature.ts
import { MyFeatureService } from '../services/my-feature.service'

export function useMyFeature() {
  // ...
}
```

### 5. Add to App Router

```tsx
// app/(dashboard)/my-feature/page.tsx
import { MyFeatureForm } from '@/features/my-feature/components/my-feature-form'

export default function MyFeaturePage() {
  return <MyFeatureForm />
}
```

---

## ✅ Best Practices

### Features
- ✅ Keep features independent
- ✅ Use dependency injection if features need to communicate
- ✅ Each feature has its own README
- ✅ Types are colocated with features

### Shared
- ✅ Only infrastructure code (UI, utils, hooks)
- ✅ No business logic
- ✅ No feature-specific code

### Database
- ✅ One schema file per business entity
- ✅ Use Drizzle migrations
- ✅ Schemas reflect domain model

### App Router
- ✅ Only routing and layout
- ✅ Import from features/
- ✅ No business logic in pages

---

## 📊 Benefits

### For Developers
- ✅ **Clear mental model** - Easy to find code
- ✅ **Scalable** - Add features without friction
- ✅ **Testable** - Isolated features
- ✅ **Maintainable** - Changes stay local

### For Business
- ✅ **Domain-driven** - Code reflects business
- ✅ **Onboarding friendly** - New devs understand fast
- ✅ **Flexible** - Easy to add/remove features
- ✅ **Future-proof** - Not tied to framework

---

**Stack:** Next.js 16 + Drizzle ORM + Tailwind 4 + Shadcn/ui
**Architecture:** Screaming Architecture (Feature-Based)
**Updated:** 28 Feb 2026
