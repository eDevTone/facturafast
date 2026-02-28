# CFDI Fácil 🧾

> Sistema de facturación electrónica SAT para México. Simple, rápido, profesional.

**"Factura en 30 segundos. Sin complicaciones. 100% SAT."**

---

## ✨ Features

- ⚡ **Onboarding automático** - Sube tu Constancia de Situación Fiscal (CSF), extrae datos automáticamente
- 📋 **Facturas CFDI 4.0** - Cumplimiento total con SAT
- 🚀 **Timbrado instantáneo** - Genera XML + PDF en segundos
- 📱 **Envío automático** - WhatsApp + Email al cliente
- 💼 **Catálogo de clientes** - Guarda clientes recurrentes
- ❌ **Cancelación fácil** - Cancela CFDIs directo desde la plataforma
- 📊 **Dashboard simple** - Ve todas tus facturas en un solo lugar

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **UI:** Shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **PDF:** jsPDF
- **Forms:** React Hook Form + Zod
- **Timbrado:** Finkok / SW Sapien (PAC)

---

## 🚀 Setup

### 1. Clone & Install

```bash
git clone https://github.com/eDevTone/cfdi-facil.git
cd cfdi-facil
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase (create project at supabase.com)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# CSF Extraction API
CSF_API_URL=your_extraction_api
CSF_API_KEY=your_api_key

# PAC (Optional for MVP, mock first)
PAC_API_URL=https://demo-facturacion.finkok.com
```

### 3. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the schema from `supabase-schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
cfdi-facil/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Main app (protected routes)
│   └── api/             # API routes
├── components/
│   ├── ui/              # Shadcn components
│   ├── invoice/         # Invoice-specific components
│   ├── client/          # Client-specific components
│   └── dashboard/       # Dashboard components
├── lib/
│   ├── supabase/        # Supabase client setup
│   ├── utils/           # Utility functions
│   └── validations/     # Zod schemas
├── types/               # TypeScript types
└── public/              # Static assets
```

---

## 🎯 MVP Roadmap

### Phase 1: Core (TODAY - 6-8 hours) ✅

- [x] Project setup
- [x] Database schema
- [x] TypeScript types
- [ ] Auth (Supabase)
- [ ] Onboarding with CSF upload
- [ ] Create invoice form
- [ ] Mock timbrado (without PAC)
- [ ] Generate PDF
- [ ] Dashboard list

### Phase 2: PAC Integration (2-3 days)

- [ ] Finkok/SW Sapien integration
- [ ] Real XML CFDI 4.0 generation
- [ ] Timbrado real
- [ ] PDF with QR + sello digital
- [ ] Testing with real invoices

### Phase 3: Features (1 week)

- [ ] Client catalog
- [ ] RFC autocomplete (SAT API)
- [ ] CFDI cancellation
- [ ] WhatsApp + Email sending
- [ ] Export to Excel
- [ ] Product/service catalog

### Phase 4: Billing (3-5 days)

- [ ] Stripe integration
- [ ] Subscription plans
- [ ] Usage limits
- [ ] Landing page

---

## 🔐 Security

- Row Level Security (RLS) enabled
- User data isolated per account
- Encrypted certificates
- Secure environment variables
- HTTPS only in production

---

## 📝 License

MIT

---

## 👨‍💻 Author

**eDevTone**
- GitHub: [@eDevTone](https://github.com/eDevTone)

---

**¿Listo para facturar sin complicaciones?** 🚀
