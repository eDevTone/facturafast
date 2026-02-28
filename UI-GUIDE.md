# FacturaFast - UI Style Guide

## 🎨 Design System: Cal.com Inspired + Tailwind 4 + Shadcn/ui

### Stack
- **Tailwind CSS 4** - Modern CSS-first configuration
- **Shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful icons

### Filosofía
- **Minimalista pero moderno**
- **Profesional sin ser corporativo**
- **Uso inteligente del color** (solo en acciones importantes)
- **Gris oscuro** (#18181B - zinc-900) en lugar de negro puro
- **Azul vibrante** para accents y CTAs

---

## 🎨 Color Palette

### Tailwind 4 Theme Variables (globals.css)

```css
@theme {
  --color-primary: #18181b;           /* Zinc-900 */
  --color-accent: #3b82f6;            /* Blue-500 */
  --color-success: #10b981;           /* Emerald-500 */
  --color-destructive: #ef4444;       /* Red-500 */
  --color-warning: #f59e0b;           /* Amber-500 */
  
  --color-background: #ffffff;
  --color-foreground: #18181b;
  --color-muted: #f4f4f5;
  --color-muted-foreground: #71717a;
  --color-border: #e5e7eb;
  
  --radius: 0.5rem;
}
```

### Usar en Componentes

```tsx
// Tailwind 4 custom colors
<div className="bg-primary text-primary-foreground">
<div className="bg-accent text-accent-foreground">
<div className="text-success">
<div className="text-destructive">
<div className="border-border">
```

---

## 🧩 Shadcn/ui Components

### Button

```tsx
import { Button } from "@/components/ui/button"

// Primary (Accent)
<Button className="bg-accent text-accent-foreground hover:bg-accent/90">
  Nueva Factura
</Button>

// Outline
<Button variant="outline">
  Cancelar
</Button>

// Ghost
<Button variant="ghost">
  Ver Más
</Button>

// Destructive
<Button variant="destructive">
  Eliminar
</Button>
```

### Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Default Card
<Card className="border-border hover:border-primary transition-colors">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>

// Stats Card
<Card className="border-border">
  <CardContent className="p-6">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total Facturado</p>
        <p className="text-3xl font-bold text-foreground mt-2">$45,230</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
        <DollarSign className="w-5 h-5 text-accent" />
      </div>
    </div>
    <p className="text-sm text-success mt-3">+12% vs mes anterior</p>
  </CardContent>
</Card>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge"

// Variants
<Badge>Default</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>

// Custom (Factura Status)
<Badge className="bg-success/10 text-success border-success/20">
  Timbrada
</Badge>

<Badge className="bg-muted text-muted-foreground">
  Draft
</Badge>

<Badge variant="destructive">
  Cancelada
</Badge>
```

---

## 📐 Layout Patterns

### Dashboard Grid

```tsx
<div className="min-h-screen bg-background">
  {/* Nav */}
  <nav className="border-b border-border bg-card">
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Logo + Actions */}
    </div>
  </nav>
  
  {/* Main */}
  <main className="max-w-7xl mx-auto px-6 py-8">
    {/* Page Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-foreground">Facturas</h1>
      <p className="text-muted-foreground mt-1">Gestiona tus facturas CFDI</p>
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Stats Cards */}
    </div>
    
    {/* Content */}
    <Card>{/* Table or Content */}</Card>
  </main>
</div>
```

---

## 🎯 Typography Scale

```tsx
{/* Headings */}
<h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
<h2 className="text-3xl font-bold text-foreground">Heading 2</h2>
<h3 className="text-2xl font-semibold text-foreground">Heading 3</h3>
<h4 className="text-xl font-semibold text-foreground">Heading 4</h4>

{/* Body */}
<p className="text-base text-foreground">Body text</p>
<p className="text-sm text-muted-foreground">Secondary text</p>
<p className="text-xs text-muted-foreground">Caption text</p>
```

---

## 🎨 Icons (Lucide React)

```tsx
import { FileText, TrendingUp, DollarSign, Users } from "lucide-react"

// Sizes
<FileText className="w-4 h-4" />  {/* Small */}
<FileText className="w-5 h-5" />  {/* Medium */}
<FileText className="w-6 h-6" />  {/* Large */}

// Colors
<FileText className="text-accent" />
<FileText className="text-success" />
<FileText className="text-destructive" />
<FileText className="text-muted-foreground" />
```

---

## ✅ Best Practices

### ✅ Do:
- Use Shadcn/ui components (Button, Card, Badge, etc.)
- Use Tailwind 4 theme variables (`bg-accent`, `text-foreground`, etc.)
- Use `border-border` for consistency
- Use `hover:border-primary` for card interactions
- Use `text-muted-foreground` for secondary text
- Keep spacing generous

### ❌ Don't:
- NO crear componentes custom si Shadcn/ui lo tiene
- NO usar negro puro (`#000000`) - usar `primary`
- NO saturar de color
- NO usar `tailwind.config.ts` (Tailwind 4 usa `@theme`)
- NO hardcodear colores - usar theme variables

---

## 📦 Adding New Shadcn/ui Components

```bash
# Install specific components
npx shadcn@latest add [component-name]

# Examples:
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add dialog
```

---

## 🎯 Factura-Specific Components

### Factura Card

```tsx
<Card className="border-border hover:shadow-md transition-shadow group">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      {/* Left: Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
          <FileText className="w-6 h-6 text-accent" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Factura #001</p>
          <p className="text-sm text-muted-foreground">Cliente SA de CV</p>
        </div>
      </div>
      
      {/* Right: Amount + Status */}
      <div className="text-right">
        <p className="text-2xl font-bold text-foreground">$5,230</p>
        <Badge className="bg-success/10 text-success border-success/20 mt-1">
          Timbrada
        </Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

### Status Badge Helper

```tsx
function getStatusBadge(status: 'draft' | 'timbrada' | 'cancelada') {
  const variants = {
    draft: 'bg-muted text-muted-foreground',
    timbrada: 'bg-success/10 text-success border-success/20',
    cancelada: 'bg-destructive/10 text-destructive border-destructive/20'
  }
  
  const labels = {
    draft: 'Borrador',
    timbrada: 'Timbrada',
    cancelada: 'Cancelada'
  }
  
  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  )
}
```

---

**Stack:** Tailwind CSS 4 + Shadcn/ui + Lucide Icons
**Style:** Cal.com / Vercel inspired
**Updated:** 28 Feb 2026
