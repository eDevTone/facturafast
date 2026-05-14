# Stripe como Payment Provider en paralelo a Conekta

**Fecha:** 2026-05-13
**Estado:** Diseño aprobado, en implementación

## Objetivo

Soportar Stripe como procesador de pagos en paralelo a Conekta (sin remover Conekta). Una variable de entorno `PAYMENT_PROVIDER` decide cuál se usa al iniciar un nuevo checkout. Los webhooks de ambos siguen activos siempre (los pagos OXXO/SPEI son asíncronos y pueden llegar días después).

## Arquitectura: Strategy Pattern

### Interfaz común

`features/billing/payment-providers/types.ts` define una interfaz `PaymentProvider` con un único método relevante para el flujo actual: `createCheckout`.

```ts
export type PaymentProviderId = 'conekta' | 'stripe'

export interface CreateCheckoutInput {
  userId: string
  customerName: string
  customerEmail: string
  packageId: StampPackageId
  successUrl: string
  failureUrl: string
  existingCustomerId: string | null
}

export interface CreateCheckoutResult {
  customerId: string
  checkoutUrl: string
  externalOrderId: string
}

export interface PaymentProvider {
  readonly id: PaymentProviderId
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>
}
```

### Estructura de archivos

```
features/billing/
  payment-providers/
    types.ts                  # interfaz + tipos compartidos
    conekta.provider.ts       # implementa PaymentProvider
    stripe.provider.ts        # implementa PaymentProvider
    index.ts                  # getActiveProvider() según env var
  services/
    account.service.ts        # firma agnóstica al provider
```

### Factory

```ts
export function getActiveProvider(): PaymentProvider {
  const id = (process.env.PAYMENT_PROVIDER ?? 'conekta') as PaymentProviderId
  if (id === 'stripe') return stripeProvider
  if (id === 'conekta') return conektaProvider
  throw new Error(`Unknown PAYMENT_PROVIDER: ${id}`)
}
```

## DB Schema (migración aditiva, columnas paralelas)

`accounts`:
- `conekta_customer_id` (existente)
- `stripe_customer_id` (nuevo, nullable)

`stamp_purchases`:
- `conekta_order_id` (existente)
- `stripe_session_id` (nuevo, nullable)
- `payment_provider` (nuevo, default `'conekta'`)

`payment_provider` permite saber el origen al consultar historial; sin él habría que deducirlo por cuál columna `*_order_id` está llena.

## Flujo de checkout

1. Usuario clic en paquete → `create-checkout.action.ts`
2. Action obtiene `provider = getActiveProvider()`
3. Llama `provider.createCheckout({...})` con datos del usuario y URLs
4. Persiste `customerId` en columna correcta (`conekta_*` o `stripe_*`)
5. Redirige a `checkoutUrl`
6. Usuario paga en el host del provider
7. Provider llama al webhook correspondiente
8. Webhook valida firma, extrae `userId` y `packageId` de metadata, llama `addStamps(userId, packageId, provider, externalOrderId)`
9. `addStamps` es idempotente: si la `externalOrderId` ya está registrada, no duplica timbres

## Métodos de pago en Stripe

`payment_method_types: ['card', 'oxxo', 'customer_balance']` con `customer_balance` configurado como SPEI (`mx_bank_transfer`). Paridad con Conekta (`card`, `cash`, `bank_transfer`).

Stripe genera dos eventos por sesión OXXO/SPEI:
- `checkout.session.completed` (cliente terminó la sesión, pago pendiente)
- `checkout.session.async_payment_succeeded` (banco/OXXO confirmó el pago)

Para card, solo llega `checkout.session.completed` con `payment_status: 'paid'`. El webhook reconoce ambos eventos y sólo acredita timbres si `payment_status === 'paid'`.

## Webhooks separados

- `/api/webhooks/conekta` (existente, sin cambios mayores)
- `/api/webhooks/stripe` (nuevo)

Cada uno valida su propia firma. El de Stripe usa `stripe.webhooks.constructEvent(rawBody, signature, secret)` con el body como string (no parseado a JSON, eso rompe la firma).

## Variables de entorno nuevas

```bash
PAYMENT_PROVIDER=conekta            # o 'stripe'; default 'conekta'
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

`STRIPE_SECRET_KEY` se necesita aunque `PAYMENT_PROVIDER=conekta` si quieres que el webhook de Stripe procese eventos rezagados.

## Lo que NO se incluye (YAGNI)

- Selector de provider por usuario o por UI
- Fallback automático si un provider falla
- Reconciliación periódica de órdenes pendientes (confiamos en webhooks)
- Tests automatizados (el repo no tiene infraestructura de tests)
