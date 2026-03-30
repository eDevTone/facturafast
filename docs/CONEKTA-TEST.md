# Conekta — Tarjetas de Prueba

## Tarjetas aprobadas

| Tipo | Número | CVV | Expiración |
|---|---|---|---|
| Visa | `4242 4242 4242 4242` | `123` | Cualquier fecha futura |
| Mastercard | `5555 5555 5555 4444` | `123` | Cualquier fecha futura |
| Amex | `3782 822463 10005` | `1234` | Cualquier fecha futura |

## Tarjetas declinadas

| Escenario | Número | CVV | Expiración |
|---|---|---|---|
| Declinada | `4000 0000 0000 0002` | `123` | Cualquier fecha futura |
| Fondos insuficientes | `4000 0000 0000 0069` | `123` | Cualquier fecha futura |

**Nombre del titular:** Cualquiera.

## OXXO (test)

En el checkout hosted, seleccionar "Pago en efectivo". Conekta genera una referencia de prueba. No requiere pagar — el webhook se puede simular desde el dashboard de Conekta.

## SPEI (test)

Seleccionar "Transferencia bancaria". Conekta genera una CLABE de prueba. Mismo manejo que OXXO.

## Webhook

URL de webhook (configurar en Conekta dashboard → Developers → Webhooks):

```
https://<tu-dominio>/api/webhooks/conekta
```

Para pruebas locales con ngrok:

```bash
ngrok http 3000
# Copia la URL y registra:
# https://abc123.ngrok-free.app/api/webhooks/conekta
```

## Env vars requeridas

```
CONEKTA_API_KEY=key_test_xxxxx          # Private key (test)
CONEKTA_PLAN_STARTER=facturafast-starter
CONEKTA_PLAN_PRO=facturafast-pro
CONEKTA_PLAN_BUSINESS=facturafast-business
```
