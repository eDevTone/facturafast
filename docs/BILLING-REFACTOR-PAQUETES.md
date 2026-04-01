# Billing Refactor: Mensualidad → Paquetes de Timbres

**Creado:** 2026-04-01  
**Status:** Planeado  
**Objetivo:** Reemplazar el modelo de suscripción mensual por compra de paquetes de timbres sin vencimiento.

---

## Por qué este cambio

El modelo actual (suscripción mensual con reset de timbres) tiene fricción para freelancers y microempresas:

- Compromiso recurrente que la gente evita
- Si no usan todos sus timbres, "pierden" lo que pagaron
- Cancelaciones mensuales = churn

El modelo de paquetes elimina esos problemas:

- **Sin compromiso** — compras cuando necesitas
- **Timbres que no vencen** — argumento de venta fuerte
- **Cash upfront** — cobras antes del servicio
- **Menos churn** — no hay nada que cancelar

---

## Pricing nuevo

| Paquete   | Timbres | Precio MXN | Por timbre |
|-----------|---------|------------|------------|
| Starter   | 20      | $99        | $4.95      |
| Básico    | 50      | $199       | $3.98      |
| Pro ★     | 100     | $349       | $3.49      |
| Business  | 300     | $799       | $2.66      |

**Regla clave:** Los timbres nunca vencen. Se acumulan.

---

## Cambios necesarios

### 1. Database Schema — `subscriptions.schema.ts`

**Eliminar campos que ya no aplican:**
- `plan` (enum free/starter/pro/business)
- `status` (active/past_due/cancelled)
- `conektaSubscriptionId` (era para suscripción recurrente)
- `currentPeriodStart` / `currentPeriodEnd` (sin periodos)
- `stampsUsed` (ya no tiene sentido contra un límite mensual)

**Agregar / renombrar:**
- `stampsBalance integer NOT NULL DEFAULT 0` — saldo actual de timbres
- `totalStampsPurchased integer NOT NULL DEFAULT 0` — acumulado histórico
- `totalStampsUsed integer NOT NULL DEFAULT 0` — acumulado histórico

**Schema resultante:**
```ts
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),
  conektaCustomerId: text('conekta_customer_id'),
  stampsBalance: integer('stamps_balance').notNull().default(0),
  totalStampsPurchased: integer('total_stamps_purchased').notNull().default(0),
  totalStampsUsed: integer('total_stamps_used').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

> Renombrar la tabla de `subscriptions` a `accounts` para reflejar que ya no es una suscripción.

---

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

### 3. Constantes — `features/billing/constants/plans.ts`

Reemplazar `PLANS` y `PLAN_LIMITS` por `STAMP_PACKAGES`:

```ts
export const STAMP_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    stamps: 20,
    price: 99,       // MXN
    conektaProductId: process.env.CONEKTA_PRODUCT_STARTER || 'ff-stamps-starter',
  },
  {
    id: 'basico',
    name: 'Básico',
    stamps: 50,
    price: 199,
    conektaProductId: process.env.CONEKTA_PRODUCT_BASICO || 'ff-stamps-basico',
  },
  {
    id: 'pro',
    name: 'Pro',
    stamps: 100,
    price: 349,
    recommended: true,
    conektaProductId: process.env.CONEKTA_PRODUCT_PRO || 'ff-stamps-pro',
  },
  {
    id: 'business',
    name: 'Business',
    stamps: 300,
    price: 799,
    conektaProductId: process.env.CONEKTA_PRODUCT_BUSINESS || 'ff-stamps-business',
  },
] as const

export type StampPackageId = (typeof STAMP_PACKAGES)[number]['id']
```

---

### 4. Billing Service — `features/billing/services/subscription.service.ts`

Renombrar a `account.service.ts`. Nuevas funciones:

| Función actual          | Nueva función           | Cambio                                      |
|-------------------------|-------------------------|---------------------------------------------|
| `getOrCreateSubscription` | `getOrCreateAccount`  | Devuelve `stampsBalance` en lugar de plan   |
| `checkUsageLimit`        | `checkStampsBalance`   | `canStamp: balance > 0`                    |
| `incrementStampsUsed`    | `consumeStamp`         | Decrementa `stampsBalance`, incrementa `totalStampsUsed` |
| `activateSubscription`   | `addStamps`            | Suma al balance, registra en `stamp_purchases` |
| `renewSubscription`      | — (eliminar)           | Ya no hay renovación automática             |
| `cancelSubscription`     | — (eliminar)           | Ya no hay suscripción que cancelar          |
| `markPastDue`            | — (eliminar)           | Ya no aplica                                |

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
    // Sumar al balance
    await tx
      .update(accounts)
      .set({
        stampsBalance: sql`stamps_balance + ${pkg.stamps}`,
        totalStampsPurchased: sql`total_stamps_purchased + ${pkg.stamps}`,
        updatedAt: new Date(),
      })
      .where(eq(accounts.userId, userId))

    // Registrar la compra
    await tx.insert(stampPurchases).values({
      userId,
      packageId,
      stampsAdded: pkg.stamps,
      amountMxn: pkg.price * 100,
      conektaOrderId,
    })
  })
}
```

---

### 5. Conekta — cambio de suscripción a orden única

**Modelo actual:** Suscripción recurrente (Conekta `subscription`)  
**Modelo nuevo:** Orden de pago única (Conekta `order`) — sin recurrencia

Cambios en `conekta.service.ts`:
- Eliminar `createSubscription` si existe
- El `createCheckoutOrder` ya funciona con órdenes únicas — solo ajustar el payload para apuntar al producto correcto (paquete de timbres)
- El webhook `order.paid` ya está implementado — solo cambiar el handler para llamar `addStamps` en lugar de `activateSubscription`

**Webhook handler (`/api/webhooks/conekta/route.ts`):**
```ts
// Antes:
case 'order.paid':
  await activateSubscription(userId, plan, customerId, subscriptionId)

// Después:
case 'order.paid':
  const packageId = order.metadata.packageId  // pasar en checkout
  await addStamps(userId, packageId, order.id)
```

---

### 6. UI Changes

**Billing page (`/billing`):**
- Reemplazar "plan cards" con "paquete cards"
- Eliminar: badge de plan actual, período de facturación, botón cancelar
- Agregar: saldo actual de timbres prominente, historial de compras
- Mantener: botón de compra por paquete

**Sidebar usage indicator:**
- Antes: `X / 30 timbres este mes`
- Después: `X timbres disponibles`

**Dashboard banner:**
- Antes: "Plan Pro — 45/100 timbres usados"
- Después: "Saldo: 45 timbres"  
- Añadir CTA cuando saldo < 10: "⚠️ Te quedan pocos timbres — Recargar"

---

### 7. Migración de usuarios existentes

Si hay usuarios con plan activo al momento del cambio:

```sql
-- Convertir stamps restantes del plan actual a balance
UPDATE accounts SET
  stamps_balance = (plan_limit - stamps_used),
  total_stamps_purchased = (plan_limit - stamps_used)
WHERE status = 'active';
```

> Darles los timbres que les quedaban del mes como saldo inicial. Es lo justo.

---

## Archivos a modificar

```
database/schemas/subscriptions.schema.ts     → renombrar + refactor
database/schemas/index.ts                    → exportar stampPurchases
features/billing/constants/plans.ts          → STAMP_PACKAGES
features/billing/services/subscription.service.ts → account.service.ts
features/billing/services/conekta.service.ts  → ajustar checkout
features/billing/actions/cancel-subscription.action.ts → eliminar
features/billing/actions/create-checkout.action.ts → ajustar packageId
features/billing/types/billing.types.ts       → nuevos tipos
app/api/webhooks/conekta/route.ts             → addStamps en order.paid
app/(dashboard)/billing/page.tsx              → UI de paquetes
components/sidebar (usage indicator)          → mostrar saldo
app/(dashboard)/page.tsx (dashboard)          → banner de saldo
```

---

## Orden de implementación recomendado

1. **Schema** — Crear migración Drizzle (nuevo schema + tabla `stamp_purchases`)
2. **account.service.ts** — Nuevas funciones (`getOrCreateAccount`, `checkStampsBalance`, `consumeStamp`, `addStamps`)
3. **plans.ts** — Reemplazar con `STAMP_PACKAGES`
4. **Webhook** — Actualizar handler `order.paid` → `addStamps`
5. **Checkout action** — Pasar `packageId` en metadata de la orden
6. **UI Billing page** — Rediseñar con paquetes + historial
7. **UI Sidebar + Dashboard** — Mostrar saldo en lugar de plan/mes
8. **Cleanup** — Eliminar acciones/funciones obsoletas

**Estimado total:** 2-3 días de trabajo.

---

## Variables de entorno nuevas

```env
# Reemplaza CONEKTA_PLAN_*
CONEKTA_PRODUCT_STARTER=ff-stamps-starter
CONEKTA_PRODUCT_BASICO=ff-stamps-basico
CONEKTA_PRODUCT_PRO=ff-stamps-pro
CONEKTA_PRODUCT_BUSINESS=ff-stamps-business
```

---

**Approach:** Implementar en rama `feat/stamp-packages`, no en main directamente.
