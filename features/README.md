# Features - Business Logic

## 🎯 Approach: Moderno (Next.js 16)

**Stack:**
- ✅ **Server Components** - Async directo a DB, sin API routes
- ✅ **Server Actions** - Mutations sin API routes
- ✅ **Funciones puras** - No clases, tree-shakeable
- ✅ **Type-safe** - TypeScript end-to-end
- ✅ **Cache defaults** - Next.js automático (sin config custom)

---

## 📁 Features Implementadas

### 1. **Invoicing** (Facturación CFDI)

```
features/invoicing/
├── services/
│   └── invoice.service.ts       # ✅ Funciones puras
├── actions/
│   └── create-invoice.action.ts # ✅ Server Action
├── types/
│   └── invoice.types.ts         # ✅ TypeScript interfaces
└── utils/
    └── invoice-calculations.ts  # ✅ Cálculos IVA/totales
```

**Services (Funciones puras):**
```typescript
export async function getInvoices(userId: string)
export async function getInvoiceById(id: string, userId: string)
export async function createInvoice(userId: string, data: CreateInvoiceInput)
export async function updateInvoice(id: string, userId: string, data: Partial<CreateInvoiceInput>)
export async function deleteInvoice(id: string, userId: string)
```

**Server Actions:**
```typescript
'use server'
export async function createInvoiceAction(data: CreateInvoiceInput)
```

**Uso en UI:**
```tsx
// Server Component (page.tsx)
export default async function FacturasPage() {
  const invoices = await getInvoices(userId) // Sin API route
  return <InvoiceList invoices={invoices} />
}

// Client Component
'use client'
export function InvoiceForm() {
  async function onSubmit(data) {
    await createInvoiceAction(data) // Sin fetch, sin API
  }
}
```

---

### 2. **Clients** (Clientes/Receptores)

```
features/clients/
├── services/
│   └── client.service.ts        # ✅ Funciones puras
├── actions/
│   └── create-client.action.ts  # ✅ Server Action
└── types/
    └── client.types.ts          # ✅ TypeScript interfaces
```

**Services:**
```typescript
export async function getClients(userId: string)
export async function getClientById(id: string, userId: string)
export async function getClientByRFC(rfc: string, userId: string)
export async function searchClients(userId: string, query: string)
export async function createClient(userId: string, data: CreateClientInput)
export async function updateClient(id: string, userId: string, data: Partial<CreateClientInput>)
export async function deleteClient(id: string, userId: string)
```

---

## 🗄️ Database Layer (Drizzle ORM)

**Schemas con Relations:**

```typescript
// database/schemas/invoices.schema.ts
export const invoices = pgTable('invoices', { ... })
export const invoiceItems = pgTable('invoice_items', { ... })

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients),
  items: many(invoiceItems)
}))
```

**Query con Relations:**
```typescript
const invoice = await db.query.invoices.findFirst({
  where: eq(invoices.id, id),
  with: {
    client: true,  // ← Join automático
    items: true    // ← Join automático
  }
})
```

---

## 📝 TypeScript Types

### Invoice Types
```typescript
interface Invoice {
  id: string
  userId: string
  clientId: string
  folio: number
  serie: string | null
  total: string
  estatus: 'draft' | 'timbrada' | 'cancelada'
  // ...
}

interface CreateInvoiceInput {
  clientId: string
  formaPago: string
  metodoPago: string
  items: CreateInvoiceItemInput[]
}

interface InvoiceWithRelations extends Invoice {
  client: Client
  items: InvoiceItem[]
}
```

---

## 🎨 Utils

### Invoice Calculations
```typescript
// Cálculo automático de totales
const { subtotal, iva, total } = calculateInvoiceTotals(items)

// IVA 16% automático
items = [
  { cantidad: 2, valorUnitario: 1000 }
]
// → subtotal: 2000, iva: 320, total: 2320

// Formateo de moneda
formatCurrency(2320) // → "$2,320.00 MXN"
```

---

## 🚀 Data Flow Example

### Crear Factura (End-to-End):

```tsx
// 1. Server Component (página)
// app/(dashboard)/facturas/nueva/page.tsx
import { InvoiceForm } from '@features/invoicing/components/invoice-form'
import { getClients } from '@features/clients/services/client.service'

export default async function NewInvoicePage() {
  const clients = await getClients(userId) // DB directo
  
  return <InvoiceForm clients={clients} />
}

// 2. Client Component (form)
// features/invoicing/components/invoice-form.tsx
'use client'
import { createInvoiceAction } from '../actions/create-invoice.action'

export function InvoiceForm({ clients }) {
  async function onSubmit(data) {
    const result = await createInvoiceAction(data) // Server Action
    
    if (result.success) {
      router.push('/facturas')
    }
  }
  
  return <form onSubmit={onSubmit}>...</form>
}

// 3. Server Action
// features/invoicing/actions/create-invoice.action.ts
'use server'
export async function createInvoiceAction(data) {
  const userId = await getCurrentUser()
  const invoice = await createInvoice(userId, data) // Service
  
  return { success: true, data: invoice }
}

// 4. Service (business logic)
// features/invoicing/services/invoice.service.ts
export async function createInvoice(userId, data) {
  const { subtotal, iva, total } = calculateInvoiceTotals(data.items)
  
  return db.transaction(async (tx) => {
    const [invoice] = await tx.insert(invoices).values({ ... })
    await tx.insert(invoiceItems).values(data.items)
    return invoice
  })
}
```

**Flow:**
```
UI Form (client) 
  → Server Action (server) 
  → Service function (server) 
  → Drizzle ORM (server) 
  → PostgreSQL
  → Return data
  → Next.js auto-serializes
  → UI updates
```

**Sin API routes. Sin fetch. Sin axios. Type-safe end-to-end.** ✅

---

## 🔒 Auth Integration (Pending)

**TODO:**
```typescript
// Reemplazar placeholder:
const userId = 'temp-user-id' // ← Placeholder

// Por Supabase auth:
import { createServerClient } from '@supabase/ssr'

async function getCurrentUser() {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

---

## 📊 Status

**Implementado:**
- ✅ Invoice service (CRUD completo)
- ✅ Client service (CRUD completo)
- ✅ Server Actions (create invoice, create client)
- ✅ TypeScript types
- ✅ Invoice calculations (IVA 16%)
- ✅ Drizzle schemas con relations
- ✅ Database transactions

**Pendiente:**
- ⏳ Auth integration (Supabase)
- ⏳ UI components (forms, lists)
- ⏳ Timbrado (PAC integration)
- ⏳ PDF/XML generation
- ⏳ Email notifications

---

**Approach:** Clean, modern, type-safe, sin boilerplate innecesario. 🚀
