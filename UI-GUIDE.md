# FacturaFast - UI Style Guide

## 🎨 Design System: Cal.com Inspired (Sin Negro Puro)

### Filosofía
- **Minimalista pero moderno**
- **Profesional sin ser corporativo**
- **Uso inteligente del color** (solo en acciones importantes)
- **Gris oscuro** (#18181B - zinc-900) en lugar de negro puro
- **Azul vibrante** para accents y CTAs

---

## 🎨 Color Palette

### Primary Colors
```css
Primary (Gris oscuro):   #18181B   /* rgb(24, 24, 27) - zinc-900 */
Accent (Azul):           #3B82F6   /* rgb(59, 130, 246) - blue-500 */
Success (Verde):         #10B981   /* rgb(16, 185, 129) - emerald-500 */
Destructive (Rojo):      #EF4444   /* rgb(239, 68, 68) - red-500 */
Warning (Amarillo):      #F59E0B   /* rgb(245, 158, 11) - amber-500 */
```

### Neutral Palette
```css
Background:     #FFFFFF   /* White */
Card:           #FFFFFF   /* White */
Muted BG:       #F9FAFB   /* gray-50 */
Border:         #E5E7EB   /* gray-200 */
Text Primary:   #18181B   /* zinc-900 */
Text Secondary: #71717A   /* zinc-500 */
Text Muted:     #A1A1AA   /* zinc-400 */
```

---

## 🧩 Components

### Buttons

**Primary (Accent Blue)**
```tsx
<Button className="bg-blue-500 text-white hover:bg-blue-600">
  Nueva Factura
</Button>
```

**Secondary (Dark Gray)**
```tsx
<Button variant="outline" className="border-zinc-300 text-zinc-900 hover:bg-zinc-50">
  Cancelar
</Button>
```

**Ghost**
```tsx
<Button variant="ghost" className="text-zinc-600 hover:bg-zinc-100">
  Ver Más
</Button>
```

---

### Cards

**Default Card**
```tsx
<Card className="border border-gray-200 hover:border-zinc-900 transition-colors">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

**Stats Card**
```tsx
<Card className="border border-gray-200 p-6">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-sm text-zinc-500">Total Facturado</p>
      <p className="text-3xl font-bold text-zinc-900 mt-2">$45,230</p>
    </div>
    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
      <DollarSign className="w-5 h-5 text-blue-600" />
    </div>
  </div>
  <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1">
    <TrendingUp className="w-4 h-4" />
    +12% vs mes anterior
  </p>
</Card>
```

**Factura Card**
```tsx
<Card className="border border-gray-200 hover:shadow-md transition-shadow group">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      {/* Left: Factura info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900">Factura #001</p>
          <p className="text-sm text-zinc-500">Cliente SA de CV</p>
        </div>
      </div>
      
      {/* Right: Amount + Status */}
      <div className="text-right">
        <p className="text-2xl font-bold text-zinc-900">$5,230</p>
        <Badge variant="default" className="mt-1">Timbrada</Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### Badges

```tsx
{/* Status badges */}
<Badge variant="default" className="bg-zinc-100 text-zinc-900">
  Draft
</Badge>

<Badge variant="default" className="bg-emerald-50 text-emerald-700 border-emerald-200">
  Timbrada
</Badge>

<Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
  Cancelada
</Badge>
```

---

### Navigation

**Top Nav**
```tsx
<nav className="border-b border-gray-200 bg-white">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-8">
      <h1 className="text-xl font-bold text-zinc-900">FacturaFast</h1>
      
      {/* Nav links */}
      <div className="hidden md:flex gap-6">
        <a href="#" className="text-sm text-zinc-600 hover:text-zinc-900">
          Facturas
        </a>
        <a href="#" className="text-sm text-zinc-600 hover:text-zinc-900">
          Clientes
        </a>
      </div>
    </div>
    
    {/* Actions */}
    <Button className="bg-blue-500 text-white hover:bg-blue-600">
      Nueva Factura
    </Button>
  </div>
</nav>
```

---

### Tables

```tsx
<Table>
  <TableHeader>
    <TableRow className="border-b border-gray-200 hover:bg-transparent">
      <TableHead className="text-zinc-500 font-medium">Folio</TableHead>
      <TableHead className="text-zinc-500 font-medium">Cliente</TableHead>
      <TableHead className="text-zinc-500 font-medium">Total</TableHead>
      <TableHead className="text-zinc-500 font-medium">Estatus</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-b border-gray-200 hover:bg-zinc-50">
      <TableCell className="font-medium text-zinc-900">001</TableCell>
      <TableCell className="text-zinc-600">Cliente SA de CV</TableCell>
      <TableCell className="text-zinc-900">$5,230</TableCell>
      <TableCell>
        <Badge className="bg-emerald-50 text-emerald-700">Timbrada</Badge>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### Forms

```tsx
<form className="space-y-6">
  {/* Input */}
  <div className="space-y-2">
    <Label className="text-sm font-medium text-zinc-900">
      RFC del Cliente
    </Label>
    <Input 
      className="border-gray-200 focus:border-zinc-900 focus:ring-zinc-900"
      placeholder="XAXX010101000"
    />
  </div>
  
  {/* Select */}
  <div className="space-y-2">
    <Label className="text-sm font-medium text-zinc-900">
      Método de Pago
    </Label>
    <Select>
      <SelectTrigger className="border-gray-200 focus:border-zinc-900">
        <SelectValue placeholder="Selecciona..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pue">PUE - Pago en Una Exhibición</SelectItem>
        <SelectItem value="ppd">PPD - Pago en Parcialidades</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  {/* Actions */}
  <div className="flex gap-3 justify-end">
    <Button variant="outline" className="border-zinc-300 text-zinc-900">
      Cancelar
    </Button>
    <Button className="bg-blue-500 text-white hover:bg-blue-600">
      Guardar
    </Button>
  </div>
</form>
```

---

## 📐 Spacing & Typography

### Spacing Scale (Tailwind Default)
```
px: 1px
0.5: 2px
1: 4px
2: 8px
3: 12px
4: 16px
6: 24px
8: 32px
12: 48px
16: 64px
```

### Typography Scale
```tsx
{/* Headings */}
<h1 className="text-4xl font-bold text-zinc-900">Heading 1</h1>
<h2 className="text-3xl font-bold text-zinc-900">Heading 2</h2>
<h3 className="text-2xl font-semibold text-zinc-900">Heading 3</h3>
<h4 className="text-xl font-semibold text-zinc-900">Heading 4</h4>

{/* Body */}
<p className="text-base text-zinc-900">Body text</p>
<p className="text-sm text-zinc-600">Secondary text</p>
<p className="text-xs text-zinc-500">Caption text</p>
```

---

## 🎯 Layout Patterns

### Dashboard Grid
```tsx
<div className="min-h-screen bg-white">
  {/* Nav */}
  <nav>{/* See Navigation above */}</nav>
  
  {/* Main */}
  <main className="max-w-7xl mx-auto px-6 py-8">
    {/* Page Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-zinc-900">Facturas</h1>
      <p className="text-zinc-500 mt-1">Gestiona todas tus facturas CFDI</p>
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Stats Cards */}
    </div>
    
    {/* Content Card */}
    <Card className="border border-gray-200">
      {/* Table or Content */}
    </Card>
  </main>
</div>
```

---

## 🎨 Icons

**Library:** Lucide React (already installed)

**Style:** Use thin/regular stroke (`strokeWidth={1.5}` or `strokeWidth={2}`)

**Sizes:**
- Small: `w-4 h-4` (16px)
- Medium: `w-5 h-5` (20px)
- Large: `w-6 h-6` (24px)

```tsx
import { FileText, TrendingUp, Settings, User } from 'lucide-react'

<FileText className="w-5 h-5 text-zinc-600" strokeWidth={2} />
```

---

## ✅ Do's and Don'ts

### ✅ Do:
- Use gris oscuro (`zinc-900`) para textos principales
- Reserve azul para acciones primarias
- Usa borders sutiles (`border-gray-200`)
- Mantén espaciado generoso
- Usa hover states en cards (`hover:border-zinc-900`)

### ❌ Don't:
- NO uses negro puro (`#000000`)
- NO satures de color (solo accents)
- NO uses sombras pesadas
- NO mezcles muchos colores
- NO uses gradientes (mantén flat)

---

**Última actualización:** 28 Feb 2026
**Inspiración:** Cal.com, Vercel, Raycast
**Framework:** Tailwind CSS + Shadcn/ui
