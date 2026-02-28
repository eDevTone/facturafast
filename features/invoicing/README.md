# Feature: Invoicing

## Propósito
Gestión completa de facturas CFDI 4.0 para el SAT (México).

## Responsabilidades
- ✅ Crear, editar, eliminar facturas (CRUD)
- ✅ Generar XML CFDI 4.0
- ✅ Generar PDF de factura
- ✅ Timbrar CFDI con PAC
- ✅ Cancelar CFDI
- ✅ Cálculos (subtotal, IVA, retenciones, total)
- ✅ Validaciones CFDI según catálogos SAT
- ✅ Auto-incremento de folios

## Estructura

```
invoicing/
├── components/          # UI Components
│   ├── invoice-form.tsx          # Formulario crear/editar
│   ├── invoice-list.tsx          # Lista de facturas
│   ├── invoice-card.tsx          # Card individual
│   ├── invoice-details.tsx       # Detalles completos
│   ├── invoice-status-badge.tsx  # Badge de status
│   └── invoice-item-input.tsx    # Input conceptos
│
├── services/            # Business Logic
│   ├── invoice.service.ts        # CRUD operations
│   ├── xml-generator.service.ts  # CFDI XML generator
│   ├── pdf-generator.service.ts  # PDF generator
│   └── folio.service.ts          # Auto-increment folios
│
├── hooks/               # React Hooks
│   ├── use-invoice.ts            # Single invoice
│   ├── use-invoice-list.ts       # List invoices
│   ├── use-create-invoice.ts     # Create mutation
│   ├── use-update-invoice.ts     # Update mutation
│   └── use-timbrar.ts            # Timbrado mutation
│
├── types/               # TypeScript Types
│   ├── invoice.types.ts          # Invoice, InvoiceItem
│   └── cfdi.types.ts             # CFDI 4.0 types
│
└── utils/               # Utilities
    ├── invoice-calculations.ts   # Subtotal, IVA, Total
    ├── invoice-validators.ts     # CFDI validations
    └── sat-catalogos.ts          # SAT catalog helpers
```

## Dependencies
- `@/features/clients` - Para seleccionar cliente receptor
- `@/features/fiscal-profile` - Para datos del emisor
- `@/features/timbrado` - Para timbrar CFDI
- `@/database/schemas/invoices.schema` - Database schema

## Usage Example

```tsx
// app/(dashboard)/facturas/page.tsx
import { InvoiceList } from '@/features/invoicing/components/invoice-list'

export default function FacturasPage() {
  return <InvoiceList />
}

// app/(dashboard)/facturas/nueva/page.tsx
import { InvoiceForm } from '@/features/invoicing/components/invoice-form'

export default function NewInvoicePage() {
  return <InvoiceForm />
}
```

## Next Steps
1. [ ] Implementar InvoiceService (CRUD)
2. [ ] Crear InvoiceForm component
3. [ ] Implementar XML generator (CFDI 4.0)
4. [ ] Implementar PDF generator
5. [ ] Crear hooks (use-invoice-list, use-create-invoice)
