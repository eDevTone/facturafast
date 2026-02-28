# FacturaFast ⚡

Sistema de facturación electrónica CFDI 4.0 para México. Rápido, simple, profesional.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-c5f74f)](https://orm.drizzle.team/)

---

## 🏗️ Architecture: Screaming Architecture

Este proyecto usa **Screaming Architecture** - la estructura grita su propósito:

```
features/
  ├── invoicing/       ← 📋 Sistema de FACTURACIÓN
  ├── clients/         ← 👥 Gestión de CLIENTES
  ├── fiscal-profile/  ← 🏢 Perfil FISCAL (CSF)
  ├── timbrado/        ← ✅ TIMBRADO PAC
  └── notifications/   ← 📬 Notificaciones
```

No necesitas buscar "donde está el código de facturas" - está en `features/invoicing/`.

📖 **[Ver documentación completa de arquitectura →](./ARCHITECTURE.md)**
📖 **[Ver guía de Screaming Architecture →](./SCREAMING-ARCHITECTURE.md)**

---

## 🚀 Features

### Core
- ✅ **CFDI 4.0** - Facturas electrónicas SAT
- ✅ **Timbrado automático** - Integración con PAC (Finkok/SW Sapien)
- ✅ **Generación XML + PDF** - Formato oficial SAT
- ✅ **Catálogo de clientes** - Gestión de receptores
- ✅ **Onboarding con CSF** - Extracción automática de datos fiscales
- ✅ **Cancelación CFDI** - Cancelar facturas timbradas

### Integraciones
- ✅ **WhatsApp** - Notificaciones via Twilio
- ✅ **Email** - Envío de facturas via Resend
- ✅ **Storage** - Almacenamiento XML/PDF en Supabase
- ✅ **Stripe** - Billing y pagos (Fase 4)

### UX
- ✅ **Cal.com inspired design** - Minimalista, moderno, profesional
- ✅ **Responsive** - Mobile, tablet, desktop
- ✅ **Fast** - Optimizado para performance
- ✅ **Accessible** - WCAG 2.1 AA

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (@theme configuration)
- **Components:** Shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **State:** React Query (TanStack Query)

### Backend
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **API:** Next.js API Routes

### Services
- **PAC:** Finkok / SW Sapien (timbrado CFDI)
- **WhatsApp:** Twilio
- **Email:** Resend
- **Payments:** Stripe

### Development
- **Mock Services** - Desarrollo sin APIs externas
- **Drizzle Studio** - Database GUI
- **TypeScript** - Type safety
- **ESLint** - Code quality

---

## 📁 Project Structure

```
facturafast/
├── features/              # 🎯 Business domain (SCREAMING)
│   ├── invoicing/         # Facturación CFDI
│   ├── clients/           # Clientes
│   ├── fiscal-profile/    # Perfil fiscal
│   ├── timbrado/          # PAC integration
│   └── notifications/     # WhatsApp + Email
│
├── shared/                # 🔧 Infrastructure
│   ├── ui/                # Shadcn/ui components
│   ├── components/        # Shared components
│   ├── hooks/             # React hooks
│   └── utils/             # Utilities
│
├── database/              # 🗄️ Data layer
│   ├── schemas/           # Drizzle schemas
│   ├── migrations/        # SQL migrations
│   └── client.ts          # DB client
│
├── config/                # ⚙️ Configuration
│   └── sat-catalogs.ts    # Catálogos SAT
│
└── app/                   # 📱 Next.js App Router
    ├── (auth)/            # Auth pages
    ├── (dashboard)/       # Dashboard
    └── api/               # API routes
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ (LTS)
- PostgreSQL (Supabase account)
- Git

### Installation

```bash
# Clone repo
git clone https://github.com/eDevTone/facturafast.git
cd facturafast

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run migrations
npm run db:push

# Start dev server
npm run dev
```

Visit: http://localhost:3000

### Database Setup (Supabase)

1. Create Supabase project: https://supabase.com/dashboard
2. Get connection string from Settings → Database
3. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```
4. Run migrations:
   ```bash
   npm run db:push
   ```

---

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE.md)** - Screaming Architecture explained
- **[UI Style Guide](./UI-GUIDE.md)** - Tailwind 4 + Shadcn/ui
- **[Feature: Invoicing](./features/invoicing/README.md)** - Facturación CFDI
- **[Feature: Clients](./features/clients/README.md)** - Catálogo de clientes
- **[Feature: Timbrado](./features/timbrado/README.md)** - PAC integration

---

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate migration
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio (GUI)

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
```

---

## 🎯 Roadmap

### Phase 1: Core MVP ✅ (Current)
- [x] Project setup (Next.js + Tailwind + Drizzle)
- [x] Screaming Architecture implementation
- [x] UI Design System (Cal.com style)
- [x] Mock services (PAC, Notifications)
- [ ] Auth UI (Supabase)
- [ ] Invoice CRUD
- [ ] Client CRUD
- [ ] Fiscal Profile setup

### Phase 2: Real Integrations
- [ ] PAC integration (Finkok)
- [ ] WhatsApp notifications (Twilio)
- [ ] Email notifications (Resend)
- [ ] CSF extraction API
- [ ] Storage (Supabase)

### Phase 3: Production Features
- [ ] CFDI cancellation
- [ ] Advanced dashboard
- [ ] Reports & analytics
- [ ] Multi-user support
- [ ] Role-based access

### Phase 4: Monetization
- [ ] Stripe integration
- [ ] Subscription plans
- [ ] Usage limits
- [ ] Invoicing (meta!)
- [ ] Public launch

---

## 💰 Business Model

### Pricing (Planned)
- **Starter:** $199 MXN/mes (50 facturas)
- **Pro:** $399 MXN/mes (200 facturas)
- **Business:** $999 MXN/mes (ilimitado)

### Revenue Potential (Conservative)
- Mes 3: $11,950 MXN (~$700 USD)
- Mes 6: $36,820 MXN (~$2,100 USD)
- Mes 12: $111,580 MXN (~$6,500 USD)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

## 📧 Contact

- **GitHub:** [@eDevTone](https://github.com/eDevTone)
- **Project:** [FacturaFast](https://github.com/eDevTone/facturafast)

---

**Built with ❤️ for the Mexican market**
