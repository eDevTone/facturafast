# Clerk Localización en Español

## Configuración Actual

FacturaFast está configurado con **español de México (es-MX)** en Clerk.

## Archivos Clave

### 1. `/lib/clerk-config.ts`
Configuración centralizada de localización y apariencia.

### 2. `/app/layout.tsx`
ClerkProvider con localización aplicada.

### 3. Páginas de Auth
- `/app/(auth)/sign-in/[[...sign-in]]/page.tsx` - Iniciar sesión
- `/app/(auth)/sign-up/[[...sign-up]]/page.tsx` - Registrarse

## Locales Disponibles

Clerk soporta múltiples locales de español:
- `esES` - Español (España)
- `esMX` - Español (México) ← **ACTUAL**

## Personalización de Textos

Para personalizar textos específicos, editar `lib/clerk-config.ts`.

## Configuración en Dashboard de Clerk

1. Ir a https://dashboard.clerk.com
2. Seleccionar tu aplicación
3. **Customization** → **Appearance**
4. Cambiar idioma predeterminado a **es-MX**

## Referencias

- [Clerk Localization Docs](https://clerk.com/docs/customization/localization)
- [Available Locales](https://clerk.com/docs/customization/localization#available-locales)
