# Feature: Clients

## Propósito
Catálogo de clientes (receptores de facturas).

## Responsabilidades
- ✅ CRUD de clientes
- ✅ Búsqueda por RFC
- ✅ Validación de RFC
- ✅ Selector de cliente para facturas

## Estructura

```
clients/
├── components/
│   ├── client-form.tsx           # Formulario crear/editar
│   ├── client-list.tsx           # Lista de clientes
│   ├── client-card.tsx           # Card individual
│   └── client-selector.tsx       # Selector para facturas
│
├── services/
│   └── client.service.ts         # CRUD operations
│
├── hooks/
│   ├── use-clients.ts            # List clients
│   ├── use-client.ts             # Single client
│   └── use-create-client.ts      # Create mutation
│
└── types/
    └── client.types.ts           # Client type
```

## Usage

```tsx
import { ClientSelector } from '@/features/clients/components/client-selector'

<ClientSelector 
  onSelect={(client) => setSelectedClient(client)} 
/>
```
