# FacturaFast - Arquitectura

## 🏗️ Stack & Tecnologías

### Core
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + Shadcn/ui
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth

### Libraries
- **Forms:** React Hook Form + Zod
- **PDF:** jsPDF
- **HTTP:** Axios

---

## 📂 Estructura del Proyecto

```
facturafast/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login, signup)
│   ├── (dashboard)/         # Protected dashboard routes
│   └── api/                 # API routes
│
├── components/              # React components
│   ├── ui/                  # Shadcn components
│   ├── invoice/             # Invoice-specific
│   ├── client/              # Client-specific
│   └── dashboard/           # Dashboard components
│
├── drizzle/                 # Drizzle ORM
│   ├── schemas/             # Database schemas
│   │   ├── fiscal-profile.ts
│   │   ├── clients.ts
│   │   ├── invoices.ts
│   │   └── index.ts
│   └── migrations/          # Auto-generated migrations
│
├── lib/
│   ├── db/                  # Database client
│   │   └── index.ts         # Drizzle + Postgres client
│   ├── services/            # Business logic
│   │   ├── invoice-service.ts
│   │   ├── client-service.ts
│   │   └── fiscal-service.ts
│   ├── mocks/               # Mock external services
│   │   ├── pac-service.ts         # Mock PAC (Finkok)
│   │   └── notification-service.ts # Mock WhatsApp/Email
│   ├── utils/               # Utility functions
│   └── validations/         # Zod schemas
│
└── types/                   # TypeScript types
```

---

## 🗄️ Database Schema (Drizzle)

### Tables

**1. user_fiscal_profile**
- Perfil fiscal del usuario (datos del CSF)
- One-to-one con auth.users
- Contiene: RFC, razón social, régimen, certificados

**2. clients**
- Catálogo de clientes del usuario
- Many-to-one con user
- Contiene: RFC, razón social, email, uso CFDI

**3. invoices**
- Facturas CFDI
- Many-to-one con user y client
- Contiene: folio, serie, montos, estatus, UUID

**4. invoice_items**
- Conceptos/items de factura
- Many-to-one con invoice
- Contiene: descripción, cantidad, precio, importe

---

## 🔧 Servicios (Services Layer)

### Business Logic Services

**InvoiceService**
- `create()` - Crear factura (draft)
- `timbrar()` - Timbrar con PAC
- `cancelar()` - Cancelar CFDI
- `generatePDF()` - Generar PDF
- `generateXML()` - Generar XML CFDI 4.0
- `list()` - Listar facturas
- `getById()` - Obtener factura

**ClientService**
- `create()` - Crear cliente
- `update()` - Actualizar cliente
- `list()` - Listar clientes
- `getByRFC()` - Buscar por RFC

**FiscalProfileService**
- `create()` - Crear perfil fiscal
- `update()` - Actualizar perfil
- `extractFromCSF()` - Extraer datos de CSF con API

### External Services (Mock → Real)

**PAC Service** (Mock por ahora)
- `timbrar()` - Timbrar CFDI
- `cancelar()` - Cancelar CFDI
- Mock genera UUID fake y simula respuesta

**Notification Service** (Mock por ahora)
- `sendWhatsApp()` - Enviar por WhatsApp
- `sendEmail()` - Enviar por Email
- `sendInvoice()` - Enviar factura completa
- Mock solo loguea en consola

---

## 🔄 Data Flow

### Crear Factura (Flujo Completo)

```
User Input (Form)
      ↓
Validation (Zod)
      ↓
InvoiceService.create()
      ↓
Drizzle ORM → Insert en DB
      ↓
estatus: 'draft'
      ↓
InvoiceService.timbrar()
      ↓
MockPACService.timbrar() [Por ahora]
      ↓
UUID generado (mock)
      ↓
InvoiceService.generateXML()
      ↓
InvoiceService.generatePDF()
      ↓
Guardar PDF + XML en Supabase Storage
      ↓
Update invoice: estatus='timbrada', uuid, urls
      ↓
NotificationService.sendInvoice()
      ↓
Log en consola [Por ahora]
      ↓
Return factura completa
```

---

## 🎯 Development Strategy

### Phase 1: Core Logic (CURRENT)
✅ Drizzle ORM setup
✅ Database schemas
✅ Mock services (PAC, Notifications)
⏳ Business logic services
⏳ CRUD completo funcional
⏳ Auth + UI

### Phase 2: Real Integrations
⏳ CSF extraction API (real)
⏳ PAC integration (Finkok/SW Sapien)
⏳ WhatsApp (Twilio)
⏳ Email (Resend)
⏳ Storage (Supabase)

### Phase 3: Production
⏳ Stripe billing
⏳ Rate limiting
⏳ Error handling robusto
⏳ Monitoring
⏳ Deploy

---

## 🔐 Security

- **RLS:** Supabase Row Level Security activo
- **Auth:** Supabase Auth con sessions
- **Data isolation:** User ID en todas las queries
- **Sensitive data:** Certificados encriptados
- **API routes:** Validación en todas las rutas

---

## 📝 Notas de Implementación

### Mocks vs Real Services

**Durante desarrollo MVP:**
- Use mocks para PAC, WhatsApp, Email
- Permite desarrollar lógica sin depender de APIs externas
- Faster iteration, sin costos por llamadas API

**Para producción:**
- Reemplazar mocks con servicios reales
- Misma interfaz, solo cambiar implementación
- Feature flags para switch gradual

### Database Migrations

```bash
# Generate migration from schema changes
npm run db:generate

# Push changes to database
npm run db:push

# Open Drizzle Studio (DB GUI)
npm run db:studio
```

---

**Built with focus on: Clean architecture, Testability, Maintainability** 🚀
