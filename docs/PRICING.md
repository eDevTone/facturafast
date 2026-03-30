# FacturaFast — Pricing Strategy

**Actualizado:** 2026-03-30
**Estado:** Definido, pendiente ajustar según costo real por timbre del PAC

---

## Planes

| Plan | Precio Early (50% OFF) | Precio Regular | Timbres/mes | Clientes |
|---|---|---|---|---|
| **Free** | $0 | $0 | 5 | Ilimitados |
| **Starter** | $79 MXN | $149 MXN | 30 | Ilimitados |
| **Pro** | $179 MXN | $349 MXN | 100 | Ilimitados |
| **Business** | $449 MXN | $899 MXN | Ilimitado | Ilimitados |

**Early Adopter Promise:** Primeros 100 usuarios mantienen precio early para siempre.

---

## IDs en Conekta

```
CONEKTA_PLAN_STARTER=facturafast-starter
CONEKTA_PLAN_PRO=facturafast-pro
CONEKTA_PLAN_BUSINESS=facturafast-business
```

> **TODO:** Actualizar montos en Conekta si cambian los precios. Los planes ya están creados en el dashboard.

---

## Value Metric: Timbres

Un "timbre" = una factura CFDI timbrada ante el SAT vía PAC (SW Sapien).

- Cada timbre tiene un costo real (fee del PAC por timbre)
- Borradores no cuentan — solo facturas timbradas exitosamente
- El contador se resetea al inicio de cada periodo de facturación

---

## Justificación de los límites

### Free (5 timbres)
- Suficiente para probar el producto y validar el flujo completo
- No alcanza para operar un negocio real → motiva upgrade
- Sin límite de clientes para que el usuario configure todo antes de pagar

### Starter — $79 MXN (30 timbres)
- Freelancers y profesionistas independientes (~1 factura/día hábil)
- Debajo de $100 MXN psicológicamente más fácil de justificar
- Cubre el 80% de los freelancers mexicanos

### Pro — $179 MXN (100 timbres)
- PyMEs con volumen moderado
- Tier recomendado (anchor pricing) — mejor valor por timbre
- ~$1.79/timbre vs Starter ~$2.63/timbre

### Business — $449 MXN (ilimitado)
- Despachos contables y empresas con alto volumen
- El margen por timbre baja, pero el volumen y retención compensan
- Competitivo vs Facturama ($299-599) y Factura.com ($199-499)

---

## Unit Economics (pendiente ajustar)

```
Costo por timbre PAC:      $??? MXN (pendiente cotización SW Sapien producción)
Comisión Conekta:           ~2.9% + $2.50 MXN por transacción

Ejemplo Starter ($79/mes, 30 timbres):
  Ingreso:                  $79.00
  - Conekta:                -$4.79 (2.9% + $2.50)
  - PAC (30 timbres):       -$???
  = Margen:                 $74.21 - costo PAC

Ejemplo Pro ($179/mes, 100 timbres):
  Ingreso:                  $179.00
  - Conekta:                -$7.69
  - PAC (100 timbres):      -$???
  = Margen:                 $171.31 - costo PAC
```

> **IMPORTANTE:** Cuando tengas el precio por timbre de SW Sapien en producción, actualiza esta sección y verifica que los márgenes sean viables. Si el costo por timbre es > $1.50 MXN, considera ajustar los límites del plan Free y Starter.

---

## Competidores (referencia)

| Competidor | Rango de precios | Notas |
|---|---|---|
| Facturama | $299-$599/mes | Más features, más caro |
| Factura.com | $199-$499/mes | Similar target |
| Aspel | $299+/mes | Software legacy, desktop |
| FacturaFast | $79-$449/mes | Más barato, más moderno |

---

## Decisiones de implementación

- **Procesador:** Conekta (tarjeta, OXXO, SPEI)
- **Checkout:** Hosted (redirect a Conekta)
- **Free tier:** Sin tarjeta requerida
- **Bloqueo:** Solo en timbrado (puede crear borradores ilimitados)
- **Indicador de uso:** Sidebar inferior con barra de progreso + timbres restantes
- **Reset de timbres:** Al inicio de cada periodo de facturación
