# Feature: Fiscal Profile

## Propósito
Perfil fiscal del usuario (emisor de facturas).

## Responsabilidades
- ✅ Gestión de perfil fiscal (RFC, razón social, régimen)
- ✅ Upload y extracción de CSF (Constancia de Situación Fiscal)
- ✅ Gestión de certificados .cer y .key
- ✅ Onboarding automático

## Estructura

```
fiscal-profile/
├── components/
│   ├── csf-upload.tsx                # Upload CSF PDF
│   ├── fiscal-profile-form.tsx       # Formulario perfil
│   └── certificate-manager.tsx       # Gestión certificados
│
├── services/
│   ├── fiscal-profile.service.ts     # CRUD
│   └── csf-extractor.service.ts      # Extracción API
│
├── hooks/
│   └── use-fiscal-profile.ts
│
└── types/
    └── fiscal-profile.types.ts
```
