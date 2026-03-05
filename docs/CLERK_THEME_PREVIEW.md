# Clerk Login/Signup - Theme Preview

## 🎨 Cómo Se Ve El Login Ahora

### Dark Mode (Default) 🌙

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           INICIA SESIÓN EN FACTURAFAST           │
│        para continuar con la facturación         │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Correo electrónico                         │ │
│  │ ┌──────────────────────────────────────┐   │ │
│  │ │ tu@email.com                         │   │ │
│  │ └──────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Contraseña                                 │ │
│  │ ┌──────────────────────────────────────┐   │ │
│  │ │ ••••••••                             │   │ │
│  │ └──────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │          Continuar (Emerald Green)         │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ─────────── o continúa con ───────────         │
│                                                  │
│  [🔵 Google]  [📘 Facebook]  [🐙 GitHub]       │
│                                                  │
│  ¿No tienes cuenta? Regístrate (Emerald)        │
│                                                  │
└──────────────────────────────────────────────────┘

Colors:
- Background: #09090b (near-black)
- Card: #111113 (dark gray)
- Inputs: #18181b (muted bg)
- Text: #fafafa (white)
- Borders: #232328 (subtle gray)
- Primary Button: #10b981 (emerald)
- Links: #10b981 (emerald)
```

### Light Mode ☀️

```
┌──────────────────────────────────────────────────┐
│                                                  │
│           INICIA SESIÓN EN FACTURAFAST           │
│        para continuar con la facturación         │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Correo electrónico                         │ │
│  │ ┌──────────────────────────────────────┐   │ │
│  │ │ tu@email.com                         │   │ │
│  │ └──────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Contraseña                                 │ │
│  │ ┌──────────────────────────────────────┐   │ │
│  │ │ ••••••••                             │   │ │
│  │ └──────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │          Continuar (Emerald Green)         │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ─────────── o continúa con ───────────         │
│                                                  │
│  [🔵 Google]  [📘 Facebook]  [🐙 GitHub]       │
│                                                  │
│  ¿No tienes cuenta? Regístrate (Emerald)        │
│                                                  │
└──────────────────────────────────────────────────┘

Colors:
- Background: #fafafa (off-white)
- Card: #ffffff (white)
- Inputs: #f4f4f5 (muted bg)
- Text: #09090b (near-black)
- Borders: #e4e4e7 (light gray)
- Primary Button: #10b981 (emerald)
- Links: #10b981 (emerald)
```

## ✨ Features

✅ **Emerald Accent** - Brand color (#10b981)
✅ **Dark/Light Theme** - Cambia automáticamente con el toggle
✅ **Spanish (Mexico)** - Todo el texto en español
✅ **Geist Sans Font** - Matching con la app
✅ **Border-only cards** - No shadows (design system)
✅ **Smooth transitions** - Entre dark/light
✅ **Social providers** - Google, Facebook, GitHub (opcional)

## 📱 Responsive

El login es totalmente responsive:
- Desktop: Max-width 400px, centrado
- Mobile: Full width con padding
- Tablet: Intermedio

## 🎨 Customización Aplicada

### Variables
```typescript
colorPrimary: "#10b981"        // Emerald green (brand)
borderRadius: "0.5rem"         // 8px rounded
fontFamily: "Geist Sans"       // Match app font
```

### Elements Customized
- Card backgrounds → bg-card
- Input fields → bg-muted/50
- Buttons → emerald primary
- Links → emerald hover
- Borders → border-border
- Text → text-foreground
- Social buttons → outline style

## 🔄 Theme Sync

El componente `ClerkThemeSync` detecta el theme actual y aplica:
- `dark` → Clerk dark baseTheme
- `light` → Clerk default (light)

Cambia instantáneamente al hacer toggle del theme en la app.

## 📍 URLs

- **Sign In:** `/sign-in`
- **Sign Up:** `/sign-up`

Ambas páginas tienen el mismo look & feel.
