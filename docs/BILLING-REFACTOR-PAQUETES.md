# Billing Refactor: Suscripción Mensual → Paquetes de Timbres

**Creado:** 2026-04-01  
**Status:** Planeado  
**Objetivo:** Eliminar el modelo de suscripción mensual y reemplazarlo por compra de paquetes de timbres sin vencimiento.

---

## Modelo nuevo

Los timbres se compran en paquetes. **No vencen. Se acumulan.** El usuario compra cuando quiere, usa cuando quiere. No hay periodos, no hay renovaciones, no hay cancelaciones.

### Por qué este cambio

El modelo actual (suscripción mensual con reset de timbres) tiene problemas para freelancers y microempresas:

- Compromiso recurrente que la gente evita
- Timbres que se "pierden" si no se usan en el mes
- Cancelaciones mensuales = churn constante
- Plan "Business ilimitado" no escala con costos reales

El modelo de paquetes elimina todo eso:

- **Sin compromiso** — compras cuando necesitas
- **Timbres que nunca vencen** — argumento de venta fuerte
- **Cash upfront** — cobras antes de dar el servicio
- **Cero churn** — no hay nada que cancelar
- **Márgenes predecibles** — cada timbre vendido tiene margen fijo

---

## Pricing

### Costo mayoreo (SW Sapien)

| Timbres | Costo MXN | $/timbre |
|---------|-----------|----------|
| 1,200   | $2,266    | $1.89    |
| 5,000   | $5,530    | $1.11    |
| 10,000  | $8,230    | $0.82    |

Para MVP, la compra inicial será de **1,200 timbres a $1.89/timbre**.

### Paquetes al público

| Paquete       | Timbres | Precio MXN | $/timbre | Costo ($1.89) | Margen | %   |
|---------------|---------|------------|----------|---------------|--------|-----|
| **Starter**   | 20      | $99        | $4.95    | $37.80        | $61.20 | 62% |
| **Básico**    | 50      | $199       | $3.98    | $94.50        | $104.50| 53% |
| **Pro** ★     | 150     | $499       | $3.33    | $283.50       | $215.50| 43% |
| **Business**  | 300     | $899       | $3.00    | $567.00       | $332.00| 37% |

**Reglas:**
- Los timbres **nunca vencen**
- Los timbres **se acumulan** — comprar otro paquete suma al saldo
- No hay plan activo, no hay periodo, no hay renovación
- El usuario puede comprar cualquier paquete en cualquier momento

### Timbres de bienvenida

Al crear cuenta, cada usuario recibe **3 timbres gratis** como saldo inicial. Es una única vez — no se renuevan ni se reponen. Suficiente para probar el producto con facturas reales. Costo por usuario: $5.67 MXN (3 × $1.89).

### Comparación con competencia

| Timbres | FacturaFast | Comp 1 | Comp 2 |
|---------|-------------|--------|--------|
| 20-25   | $99 (20)    | $105 (20) | $150 (25) |
| 50      | $199        | —      | $250   |
| 150     | $499        | —      | —      |
| 300     | $899        | $600 (250) | $600 (200) |

Somos competitivos en entrada y medio. En volumen alto somos más caros pero damos más timbres por paquete.

---

## Cambios técnicos

### 1. Database Schema

**Archivo:** `database/schemas/subscriptions.schema.ts`

**Estado actual:**
```ts
// Enums
planEnum: ['free', 'starter', 'pro', 'business']
subscriptionStatusEnum: ['active', 'past_due', 'cancelled']

// Tabla subscriptions
id, userId, conektaCustomerId, conektaSubscriptionId,
plan, status, stampsUsed, currentPeriodStart, currentPeriodEnd,
createdAt, updatedAt
```

**Eliminar:**
- `planEnum` y `subscriptionStatusEnum` — ya no hay planes ni estados
- `plan` — no hay plan activo
- `status` — no hay estado de suscripción
- `conektaSubscriptionId` — no hay suscripción recurrente
- `currentPeriodStart` / `currentPeriodEnd` — no hay periodos
- `stampsUsed` — ya no se cuenta contra un límite mensual

**Renombrar tabla** `subscriptions` → `accounts`

**Schema nuevo:**
```ts
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  conektaCustomerId: text('conekta_customer_id'),
  stampsBalance: integer('stamps_balance').notNull().default(3), // 3 timbres de bienvenida
  totalStampsPurchased: integer('total_stamps_purchased').notNull().default(0),
  totalStampsUsed: integer('total_stamps_used').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

### 2. Tabla nueva: `stamp_purchases`

Historial de cada compra para auditoría y soporte.

```ts
export const stampPurchases = pgTable('stamp_purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  packageId: text('package_id').notNull(),        // 'starter' | 'basico' | 'pro' | 'business'
  stampsAdded: integer('stamps_added').notNull(),
  amountMxn: integer('amount_mxn').notNull(),     // en centavos
  conektaOrderId: text('conekta_order_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
```

---

### 3. Constantes

**Archivo:** `features/billing/constants/plans.ts`

**Eliminar:** `PLANS`, `PLAN_LIMITS` y toda referencia a planes mensuales.

**Reemplazar con:**
```ts
export const STAMP_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    stamps: 20,
    price: 99,       // MXN
    pricePerStamp: 4.95,
    conektaProductId: process.env.CONEKTA_PRODUCT_STARTER || 'ff-stamps-starter',
  },
  {
    id: 'basico',
    name: 'Básico',
    stamps: 50,
    price: 199,
    pricePerStamp: 3.98,
    conektaProductId: process.env.CONEKTA_PRODUCT_BASICO || 'ff-stamps-basico',
  },
  {
    id: 'pro',
    name: 'Pro',
    stamps: 150,
    price: 499,
    pricePerStamp: 3.33,
    recommended: true,
    conektaProductId: process.env.CONEKTA_PRODUCT_PRO || 'ff-stamps-pro',
  },
  {
    id: 'business',
    name: 'Business',
    stamps: 300,
    price: 899,
    pricePerStamp: 3.00,
    conektaProductId: process.env.CONEKTA_PRODUCT_BUSINESS || 'ff-stamps-business',
  },
] as const

export type StampPackageId = (typeof STAMP_PACKAGES)[number]['id']
```

**Eliminar tipos:** `features/billing/types/billing.types.ts` — reemplazar `PlanId`, `PlanDefinition`, `PLAN_LABELS` con tipos derivados de `STAMP_PACKAGES`.

---

### 4. Billing Service

**Archivo actual:** `features/billing/services/subscription.service.ts`  
**Renombrar a:** `features/billing/services/account.service.ts`

| Función actual                | Nueva función          | Cambio                                                |
|-------------------------------|------------------------|-------------------------------------------------------|
| `getOrCreateSubscription()`   | `getOrCreateAccount()` | Devuelve `stampsBalance` en lugar de plan/status      |
| `saveConektaCustomerId()`     | `saveConektaCustomerId()` | Sin cambios — se sigue guardando temprano          |
| `checkUsageLimit()`           | `checkStampsBalance()` | `canStamp: balance > 0` (sin lógica de infinity)      |
| `incrementStampsUsed()`       | `consumeStamp()`       | Decrementa `stampsBalance`, incrementa `totalStampsUsed` |
| `activateSubscription()`      | → `addStamps()`        | Suma al balance, registra en `stamp_purchases`        |
| `renewSubscription()`         | **ELIMINAR**           | No hay renovación                                     |
| `markPastDue()`               | **ELIMINAR**           | No hay estado past_due                                |
| `cancelSubscription()`        | **ELIMINAR**           | No hay suscripción que cancelar                       |

**Nueva función `addStamps`:**
```ts
export async function addStamps(
  userId: string,
  packageId: StampPackageId,
  conektaOrderId: string,
): Promise<void> {
  const pkg = STAMP_PACKAGES.find(p => p.id === packageId)
  if (!pkg) throw new Error(`Package not found: ${packageId}`)

  await db.transaction(async (tx) => {
    await tx
      .update(accounts)
      .set({
        stampsBalance: sql`stamps_balance + ${pkg.stamps}`,
        totalStampsPurchased: sql`total_stamps_purchased + ${pkg.stamps}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.userId, userId))

    await tx.insert(stampPurchases).values({
      userId,
      packageId,
      stampsAdded: pkg.stamps,
      amountMxn: pkg.price * 100, // centavos
      conektaOrderId,
    })
  })
}
```

**Nueva función `consumeStamp`:**
```ts
export async function consumeStamp(userId: string): Promise<void> {
  const result = await db
    .update(accounts)
    .set({
      stampsBalance: sql`stamps_balance - 1`,
      totalStampsUsed: sql`total_stamps_used + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.userId, userId), gt(accounts.stampsBalance, 0)))
    .returning()

  if (result.length === 0) {
    throw new Error('No stamps available')
  }
}
```

---

### 5. Conekta Service

**Archivo:** `features/billing/services/conekta.service.ts`

El `createCheckoutOrder()` ya crea órdenes únicas (no suscripciones). Solo hay que ajustar:

- El metadata debe incluir `packageId` en lugar de `plan_id`
- El `line_items` debe apuntar al producto del paquete seleccionado
- Eliminar cualquier referencia a `subscription` o `plan`

---

### 6. Server Actions

**`features/billing/actions/create-checkout.action.ts`**
- Recibe `packageId` en lugar de `planId`
- Pasa `packageId` en el metadata de la orden Conekta
- El resto del flujo (crear customer → crear order → redirect) se mantiene igual

**`features/billing/actions/cancel-subscription.action.ts`**
- **ELIMINAR completamente** — no hay suscripción que cancelar

---

### 7. Webhook

**Archivo:** `app/api/webhooks/conekta/route.ts`

**Estado actual:** Maneja 4 eventos (`order.paid`, `subscription.paid`, `subscription.payment_failed`, `subscription.canceled`)

**Nuevo:** Solo necesita `order.paid`:

```ts
case 'order.paid':
  const packageId = order.metadata.packageId
  const userId = order.metadata.user_id
  await addStamps(userId, packageId, order.id)
  break
```

**Eliminar handlers:**
- `subscription.paid` — no hay renovación
- `subscription.payment_failed` — no hay pagos recurrentes
- `subscription.canceled` — no hay suscripción

---

### 8. UI Components

**`features/billing/components/billing-page.tsx`** — Rediseño completo:
- Eliminar: badge de plan actual, periodo de facturación, barra de progreso mensual, botón cancelar
- Agregar: saldo actual de timbres prominente, grid de paquetes para comprar
- Mantener: alertas de success/error post-pago

**`features/billing/components/purchase-history.tsx`** — Componente nuevo:
- Tabla con historial de compras del usuario (datos de `stamp_purchases`)
- Columnas: Fecha, Paquete, Timbres, Monto
- Los 3 timbres de bienvenida se muestran como "Bienvenida" / "Gratis"
- Ordenado por fecha descendente (más reciente primero)
- Se muestra debajo del grid de paquetes en la página de billing
- Ejemplo:

  ```
  Fecha          Paquete     Timbres    Monto
  02/04/2026     Pro         +150       $499.00
  01/04/2026     Starter     +20        $99.00
  01/04/2026     Bienvenida  +3         Gratis
  ```

**`features/billing/components/plan-card.tsx`** → Renombrar a `package-card.tsx`:
- Mostrar: nombre del paquete, cantidad de timbres, precio, precio por timbre
- Badge "Recomendado" en Pro
- CTA siempre activo (cualquier paquete se puede comprar en cualquier momento)
- Eliminar: lógica de "plan actual", lógica de downgrade disabled

**`features/billing/components/usage-indicator.tsx`** — Simplificar:
- Antes: `15 / 30 timbres este mes` + barra de progreso + fecha de renovación
- Después: `45 timbres disponibles` + link a recargar si saldo < 10
- Eliminar: barra de progreso, fecha de renovación, lógica de "ilimitado"

**`features/billing/components/plan-usage-banner.tsx`** → Renombrar a `stamps-banner.tsx`:
- Antes: "Plan Pro — 45/100 timbres usados"
- Después: "Saldo: 45 timbres"
- CTA cuando saldo < 10: "Te quedan pocos timbres — Recargar"

---

### 9. Layout & Sidebar

**`app/(dashboard)/layout.tsx`**
- Actualmente llama `getOrCreateSubscription()` y pasa plan, stamps, limit, periodEnd
- Cambiar a `getOrCreateAccount()` y pasar solo `stampsBalance`
- Eliminar props: plan, limit, periodEnd

**`shared/components/sidebar.tsx`**
- Recibe `stampsBalance` en lugar de plan/stamps/limit/periodEnd
- Pasa a `<UsageIndicator />` solo el saldo

---

## Archivos a modificar (resumen)

```
MODIFICAR:
  database/schemas/subscriptions.schema.ts    → renombrar tabla + nuevo schema
  database/schemas/index.ts                   → exportar accounts + stampPurchases
  features/billing/constants/plans.ts         → STAMP_PACKAGES
  features/billing/services/subscription.service.ts → renombrar + refactor
  features/billing/services/conekta.service.ts → packageId en metadata
  features/billing/actions/create-checkout.action.ts → packageId
  features/billing/components/billing-page.tsx → rediseño completo
  features/billing/components/plan-card.tsx    → renombrar a package-card.tsx
  features/billing/components/usage-indicator.tsx → simplificar
  features/billing/components/plan-usage-banner.tsx → renombrar + simplificar
  app/api/webhooks/conekta/route.ts           → solo order.paid
  app/(dashboard)/layout.tsx                  → getOrCreateAccount
  shared/components/sidebar.tsx               → solo stampsBalance

ELIMINAR:
  features/billing/actions/cancel-subscription.action.ts
  features/billing/types/billing.types.ts     → tipos se derivan de STAMP_PACKAGES

CREAR:
  database/schemas/stamp-purchases.schema.ts  → tabla stamp_purchases
  features/billing/components/purchase-history.tsx → historial de compras
```

---

## Orden de implementación

1. **Schema** — Migración Drizzle: tabla `accounts` + tabla `stamp_purchases`
2. **Constantes** — `STAMP_PACKAGES` reemplaza `PLANS` y `PLAN_LIMITS`
3. **Service** — `account.service.ts` con `getOrCreateAccount`, `checkStampsBalance`, `consumeStamp`, `addStamps`
4. **Webhook** — Simplificar a solo `order.paid` → `addStamps`
5. **Checkout action** — Pasar `packageId` en metadata
6. **UI Billing page** — Rediseño con paquetes + saldo + historial
7. **UI Sidebar + Dashboard** — Mostrar saldo en lugar de plan/mes
8. **Cleanup** — Eliminar archivos obsoletos, tipos, acciones

---

## Variables de entorno

**Eliminar:**
```env
CONEKTA_PLAN_STARTER
CONEKTA_PLAN_PRO
CONEKTA_PLAN_BUSINESS
```

**Agregar:**
```env
CONEKTA_PRODUCT_STARTER=ff-stamps-starter
CONEKTA_PRODUCT_BASICO=ff-stamps-basico
CONEKTA_PRODUCT_PRO=ff-stamps-pro
CONEKTA_PRODUCT_BUSINESS=ff-stamps-business
```

---

## Migración de usuarios existentes

Si hay usuarios con suscripción activa al momento del cambio:

```sql
-- Convertir stamps restantes a saldo
-- (plan_limit - stamps_used) = timbres que les quedaban
UPDATE accounts SET
  stamps_balance = GREATEST(0, plan_limit - stamps_used),
  total_stamps_purchased = GREATEST(0, plan_limit - stamps_used)
WHERE status = 'active';
```

Los usuarios con plan "free" quedan con `stamps_balance = 3` — reciben los timbres de bienvenida como si fueran nuevos.

---

**Branch:** `feat/stamp-packages`
