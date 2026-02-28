# Feature: Timbrado

## Propósito
Integración con PAC (Proveedor Autorizado de Certificación) para timbrado CFDI.

## Responsabilidades
- ✅ Timbrar CFDI (obtener UUID)
- ✅ Cancelar CFDI
- ✅ Mock service para desarrollo
- ✅ Real PAC integration (Finkok/SW Sapien)

## Estructura

```
timbrado/
├── services/
│   ├── pac.service.ts            # Interface PAC
│   ├── pac-mock.service.ts       # Mock (desarrollo)
│   ├── pac-finkok.service.ts     # Finkok (producción)
│   └── pac-sw.service.ts         # SW Sapien (alternativa)
│
└── types/
    └── timbrado.types.ts
```
