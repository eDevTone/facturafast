# Onboarding Wizard Design

**Fecha:** 2026-04-07
**Status:** Aprobado

---

## Resumen

Wizard de 2 pasos que guía a nuevos usuarios desde el signup hasta tener su perfil fiscal configurado. Vive en `/onboarding` como ruta dedicada fuera del layout del dashboard. Sin perfil fiscal, el usuario no puede acceder al dashboard.

## Flujo

```
Signup (Clerk) → /dashboard → layout detecta sin perfil → redirect /onboarding
  → Paso 1: Bienvenida → Paso 2: Perfil Fiscal → redirect /dashboard
```

## Routing y Protección

- La detección de usuario nuevo se hace en el **layout del dashboard** (`app/(dashboard)/layout.tsx`), no en el middleware. Razón: evitar queries a DB en Edge Runtime.
- `layout.tsx` del dashboard: si el usuario no tiene `issuingProfiles`, redirige a `/onboarding`.
- `page.tsx` del onboarding: si el usuario ya tiene perfil fiscal, redirige a `/dashboard`.
- El onboarding tiene su propio route group `(onboarding)` con layout limpio (sin sidebar/header).

## Estructura de Archivos

```
app/(onboarding)/onboarding/page.tsx          ← Server Component, check + redirect
app/(onboarding)/onboarding/layout.tsx        ← Layout limpio, centrado
features/onboarding/components/onboarding-wizard.tsx   ← Client Component, maneja pasos
features/onboarding/components/welcome-step.tsx
features/onboarding/components/fiscal-profile-step.tsx
```

## Paso 1: Bienvenida

- Logo de FacturaFast
- Heading: "Bienvenido a FacturaFast"
- Subtexto: "Facturación electrónica simple, rápida y sin complicaciones"
- 3 bullets con íconos:
  - Timbra en segundos — CFDI 4.0 válido ante el SAT
  - XML + PDF automáticos — Descarga o envía por email al instante
  - Tus datos seguros — Certificados encriptados, nunca compartidos
- Card destacada: "Tienes 3 timbres gratis para probar — sin tarjeta de crédito"
- Botón primario "Comenzar →"
- Indicador de pasos: 1 / 2

## Paso 2: Perfil Fiscal

- Heading: "Configura tu perfil fiscal"
- Subtexto: "Necesitamos tus datos fiscales para generar facturas válidas"
- Reutiliza `IssuingProfileForm` completo (CSF upload, datos fiscales, certificados CSD)
- Callout informativo antes de la sección CSD:
  > Necesitarás tus certificados CSD para timbrar facturas.
  > Si los tienes a la mano, súbelos ahora. Si no, puedes agregarlos después desde tu perfil.
  > [¿Cómo obtener mis certificados? →]
- El link abre un Sheet/Dialog con pasos para obtener CSD en el portal del SAT (CertiSAT Web)
- Botón del form: "Crear perfil y continuar"
- Indicador de pasos: 2 / 2
- Link "← Volver" para regresar al paso 1

## Post-Onboarding

- Si el usuario creó perfil sin CSD, el dashboard muestra banner persistente: "Sube tus certificados CSD para poder timbrar" con link a `/fiscal-profiles`.
- Los hints existentes en el dashboard siguen guiando a crear cliente y primera factura.

## Visual Design

- Layout: pantalla completa centrada, max-width `md` (~28rem)
- Fondo: `bg-background` con gradiente emerald sutil
- Sin sidebar ni header
- Transiciones: fade + slide horizontal entre pasos
- Responsive: mobile ancho completo con padding, desktop centrado
- Tema: dark-first emerald consistente con el resto de la app

## Reutilización

- `IssuingProfileForm` se reutiliza sin modificaciones
- El botón del form cambia texto vía prop existente o wrapper
