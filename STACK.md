# FacturaFast - Tech Stack

## 🚀 Modern Serverless Stack

### **Database: Neon** 🟢
- **What:** Serverless PostgreSQL with branching
- **Why:** Auto-pause (free tier), Git-like branching, fast
- **Free tier:** 0.5GB storage, 3GB transfer/month
- **Paid:** $19/month (Launch plan - 10GB)

**Setup:**
1. Sign up: https://neon.tech
2. Create project
3. Get connection string
4. Add to `.env.local`

---

### **Auth: Clerk** 🔐
- **What:** Authentication & User Management
- **Why:** Organizations, webhooks, better DX than Supabase Auth
- **Free tier:** 10,000 monthly active users
- **Paid:** $25/month (Pro - unlimited users)

**Features:**
- ✅ Email/Password
- ✅ OAuth (Google, GitHub, etc.)
- ✅ Organizations (multi-tenant)
- ✅ Webhooks (sync users to DB)
- ✅ React components

**Setup:**
1. Sign up: https://clerk.com
2. Create application
3. Get API keys
4. Install `@clerk/nextjs`

---

### **Storage: Cloudflare R2** ☁️
- **What:** S3-compatible object storage
- **Why:** Super cheap, fast, no egress fees
- **Free tier:** 10GB storage
- **Paid:** $0.015/GB/month (15x cheaper than S3)

**Use case:** Store PDFs/XMLs de facturas

**Setup:**
1. Cloudflare account
2. Create R2 bucket
3. Get API keys
4. S3-compatible SDK

---

## 📦 Full Stack

```
Frontend:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - Shadcn/ui

Backend:
  - Next.js Server Actions
  - Next.js Server Components
  - No API routes needed

Database:
  - Neon (Serverless Postgres)
  - Drizzle ORM
  - Drizzle Kit (migrations)

Auth:
  - Clerk
  - JWT tokens
  - Webhooks → sync to DB

Storage:
  - Cloudflare R2
  - PDFs (jsPDF)
  - XMLs (CFDI 4.0)

External Services:
  - PAC: Finkok/SW Sapien (CFDI timbrado)
  - Email: Resend
  - WhatsApp: Twilio (optional)
```

---

## 🔗 Connection Strings

```bash
# .env.local

# Neon Database
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/facturafast?sslmode=require"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Cloudflare R2
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="facturafast-invoices"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 💰 Cost Breakdown

### Free Tier (MVP - 0-100 users)
```
Neon:    $0 (0.5GB DB, auto-pause)
Clerk:   $0 (10k MAU)
R2:      $0 (10GB storage)
Vercel:  $0 (Hobby plan)
------
Total:   $0/month
```

### Growth (100-1k users, generating revenue)
```
Neon:    $19/month (Launch - 10GB DB)
Clerk:   $25/month (Pro - unlimited users)
R2:      ~$1/month (50GB storage)
Vercel:  $20/month (Pro)
------
Total:   ~$65/month
```

### Scale (1k-10k users)
```
Neon:    $69/month (Scale - 50GB DB)
Clerk:   $25/month (Pro)
R2:      ~$5/month (200GB storage)
Vercel:  $20/month (Pro)
------
Total:   ~$119/month
```

**vs Supabase Pro:** $25/month (pero con límites más restrictivos)

---

## ✅ Why This Stack?

### No Vendor Lock-in
- ✅ Neon = Standard Postgres (can migrate)
- ✅ Clerk = Can switch to Auth0/NextAuth
- ✅ R2 = S3-compatible (can switch to S3/Minio)

### Serverless = Cost Efficient
- ✅ Neon auto-pause (free tier doesn't charge when idle)
- ✅ Vercel serverless functions
- ✅ Pay only for what you use

### Developer Experience
- ✅ Neon branching (dev/staging/prod)
- ✅ Clerk webhooks (auto-sync users)
- ✅ Type-safe (TypeScript + Drizzle)
- ✅ Fast iteration

### Performance
- ✅ Neon: Fast Postgres, no overhead
- ✅ Clerk: Global CDN
- ✅ R2: Cloudflare edge network
- ✅ Next.js edge runtime

---

## 🎯 Setup Order

1. **Neon** (5 min)
   - Create project
   - Get connection string
   - Test with Drizzle

2. **Clerk** (10 min)
   - Create app
   - Install SDK
   - Add middleware
   - Setup webhooks

3. **Drizzle Push** (2 min)
   - Push schemas to Neon
   - Verify tables

4. **R2** (later)
   - Create bucket
   - Configure SDK
   - Test upload

---

**Stack:** Modern, serverless, cost-efficient, no lock-in 🚀
