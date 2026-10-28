# Cobranza

**Fecha:** 2026-10-20
**Estado:** aprobado y programado el 2026-10-20. Falta verlo con un timbrado real (SW sin timbres) y la 5.7, que va con el feature 6.
**Plan:** feature 5 de `PLAN-FEATURES.md`

## Objetivo

- **Saber quién te debe:** cada factura timbrada dice si está por cobrar, parcial, cobrada o vencida.
- **El Inicio dice cuánto te deben** y qué está vencido.
- **Recordar el pago** por WhatsApp o por correo, con tus datos para que te paguen: banco, CLABE y link.

## Alcance

**Entra:**

- 5.1 días de crédito por cliente y vencimiento por factura;
- 5.2 estado de cobro, incluida la PUE que se cobra después y su límite de fin de mes;
- 5.3 "Te deben" en el Inicio y filtros de cobro en la lista;
- 5.4 datos para que te paguen: en el perfil fiscal, el PDF y el correo de la factura;
- 5.5 recordatorio por WhatsApp;
- 5.6 recordatorio por correo. Por ahora sale con el remitente de pruebas; en producción necesita un dominio verificado en Resend.

**Fuera:**

- 5.7 recordatorios automáticos: van con el cron del feature 6;
- `CondicionesDePago` en el XML: no se toca el XML mientras no haya timbres de prueba en SW;
- conciliación bancaria y cobro con pasarela (el link de pago es solo un texto).

## Reglas confirmadas

- **PUE que se cobra después** (RMF 2026, regla 2.7.1.39, DOF del 28 de diciembre de 2025).
  - **Cuándo se permite:** si no te pagan al expedir la factura, puedes usar PUE solo si el pago total se pactó o se espera a más tardar el **último día del mes** en que la expediste, y si de verdad se paga en ese plazo.
  - **Si no te pagan a tiempo:** se cancela y se emite una nueva con forma de pago 99 y método PPD. La nueva se relaciona con la original como sustitución (04), y cada pago lleva su complemento.
  - **El día 17** del mes siguiente solo aplica al sector financiero.
  - **En la app:**
    - una PUE por cobrar vence a fin de mes;
    - pasada esa fecha, la app propone sustituirla por una PPD (el flujo "Corregir factura" del feature 2);
    - si los días de crédito llevan el vencimiento más allá de fin de mes, el formulario sugiere PPD.
- **CLABE:** tiene 18 dígitos: banco (3), plaza (3), cuenta (11) y dígito verificador (1).
  - **Cómo se calcula el verificador:** los 17 primeros dígitos se multiplican por los pesos 3, 7, 1 (repetidos) y se suman los productos, cada uno módulo 10. El dígito es (10 − suma mód 10) mód 10.
  - Se comprobó con `032180000118359719`.
- **Banco de una CLABE:** sale de la lista oficial de instituciones del SPEI de Banxico (servicio del CEP, consultada el 2026-10-20: 97 instituciones).
  - Los 3 primeros dígitos de la CLABE son los 3 últimos de la clave de la institución: `40012` → `012`, BBVA MEXICO.
  - Ninguna institución repite esos 3 dígitos.
  - Se guarda como JSON en el código. No es un catálogo del SAT y solo sirve para mostrar el banco.
- **WhatsApp:** `https://wa.me/<número>?text=<mensaje>`.
  - El número va en formato internacional, solo con dígitos, sin "+" ni ceros iniciales. En México es 52 más los 10 dígitos.
  - Sin número, `https://wa.me/?text=<mensaje>` deja elegir el contacto.

## Modelo de datos (migración 0014)

| Tabla | Columna | Tipo | Uso |
|---|---|---|---|
| `clients` | `payment_terms_days` | integer, nulo | "Días de crédito". Nulo es sin plazo. |
| `invoices` | `payment_terms_days` | integer, nulo | Se copia del cliente al borrador y se puede editar. |
| `invoices` | `due_date` | date, nulo | Se fija al timbrar: día del timbrado (Ciudad de México) más los días. |
| `invoices` | `awaiting_payment` | boolean, `false` | Solo PUE: está marcada por cobrar. |
| `issuing_profiles` | `bank_name`, `clabe`, `payment_link` | varchar(60), varchar(18), text | Datos para que te paguen. |
| `payment_reminders` | `id`, `user_id`, `invoice_id`, `channel`, `created_at` | `channel`: enum `reminder_channel` (`whatsapp`, `email`) | Historial de recordatorios. |

- `payment_reminders.invoice_id` borra en cascada y tiene índice.
- **Datos existentes:** no cambian. Las facturas ya timbradas quedan sin vencimiento, así que nunca salen como vencidas, y las PUE quedan cobradas.

## Estado de cobro

Lo calcula una función pura, `collectionState(invoice, paid, today)`, en `features/collections/utils/collection-state.ts`.

Solo aplica a facturas vigentes (`timbrada` o `cancelacion_rechazada`). Los borradores, las canceladas, las que están en cancelación y las que ya sustituyó otra no tienen estado de cobro.

| Método | Condición | Estado |
|---|---|---|
| PPD | saldo ≤ 0 | cobrada |
| PPD | vencimiento antes de hoy | vencida |
| PPD | ya se cobró algo | parcial |
| PPD | lo demás | por cobrar |
| PUE | no está marcada por cobrar | cobrada |
| PUE | marcada y ya terminó el mes de emisión | vencida; hay que sustituirla por una PPD |
| PUE | marcada y vencimiento antes de hoy | vencida |
| PUE | marcada | por cobrar |

- **Saldo:**
  - PPD: el total menos lo cobrado con complementos (los sustituidos no cuentan);
  - PUE por cobrar: el total.
- **Al timbrar:** una PUE con días de crédito mayores que 0 nace por cobrar; sin días, nace cobrada.
- **"Te deben" en pesos:** cada saldo se multiplica por el tipo de cambio de su factura, como ya hace el Inicio.

## Cliente y formulario de factura

- **Cliente:** "Días de crédito" (de 0 a 365, opcional). Va en la sección "Facturación", que también aparece para los clientes del extranjero.
- **Factura:** en "Cómo te pagan" se agrega "Días de crédito", prellenado con el del cliente. Debajo, "Vence el 19 de noviembre si la timbras hoy".
  - **PUE con vencimiento después de fin de mes:** un aviso dice "Si te pagan después de fin de mes, el SAT pide «Pago después (PPD)»", con el botón "Cambiar a PPD".
- **Al timbrar** se guardan `due_date` y `awaiting_payment`. "Duplicar" y "Corregir factura" copian los días.

## Detalle de la factura

- **PPD:** el talón muestra, junto al saldo, "Vence el 19 nov" o "Venció hace 3 días" (en tinta roja).
- **PUE por cobrar:** un talón "Cobro" con el estado, "Ya me pagaron" y "Recordar pago".
  - Pasado el fin de mes, avisa la regla del SAT y ofrece "Sustituir por una factura PPD". Ese botón crea el borrador de corrección con PPD y forma 99; al timbrarlo se pide cancelar la original con el motivo 01, como en el feature 2.
  - Antes del fin de mes, la misma opción aparece como "¿No te pagarán este mes?".
- **Menú:** "Marcar por cobrar" en una PUE cobrada.
- **"Recordar pago"** (botón cuando hay saldo): un diálogo con el mensaje, que se puede editar, y dos salidas.
  - "Abrir WhatsApp": abre `wa.me` con el mensaje y lo registra. Abre primero y registra después, para que el navegador no bloquee la ventana.
  - "Enviar por correo": manda el mensaje con el XML y el PDF de la factura, con `replyTo` al correo del perfil para que el cliente te conteste a ti.
    - Máximo uno al día por factura.
    - Se deshabilita si el cliente no tiene correo ("Agrega el correo de tu cliente").
  - Muestra el último recordatorio ("Último recordatorio: 20 oct, por correo").
  - Si el perfil no tiene CLABE, sugiere agregarla, con un link al perfil.

## El mensaje

El mismo texto sirve para WhatsApp y para el correo. Lo que se ve en el diálogo es lo que se manda.

```
Hola, buen día. Le escribo para recordarle el pago de la factura A-12 por $10,408.33, que venció el 19 de octubre.

Datos para el pago:
Banco: BBVA MEXICO
CLABE: 012 180 00123456789 0
A nombre de: KARLA FUENTE NOLASCO
En línea: https://mpago.la/abc

Gracias.
```

- **Si ya pagaron una parte:** "…el saldo de la factura A-12: $5,408.33 de $10,408.33".
- **Por vencimiento:** sin vencimiento no menciona fecha; si todavía no vence, dice "que vence el …".
- **En dólares:** "USD 2,500.00".
- **Sin datos de pago:** no lleva ese bloque.
- **Teléfono:**
  - 10 dígitos de un cliente de México: se antepone 52;
  - un cliente de EE. UU. o Canadá con 10 dígitos: se antepone 1;
  - en otro caso, los dígitos tal como están.

## Lista e Inicio

- **Lista:**
  - **Filtros:** se agregan "Por cobrar" (incluye parciales y vencidas) y "Vencidas". Se puede llegar con `?estado=por-cobrar` o `?estado=vencidas` desde el Inicio. Los filtros pasan a otra línea si no caben.
  - **Debajo del total:** "Por cobrar", "Saldo $X", "Vencida" en tinta roja, o "Pagada" en las PPD. Una PUE cobrada no muestra nada.
- **Inicio:** una hoja "Te deben" entre el mes y las últimas facturas.
  - Muestra el total en pesos, cuántas facturas son y cuánto está vencido.
  - Lista hasta 5 facturas, primero las vencidas y las más antiguas, con "Venció hace 12 días" o "Vence en 5 días".
  - "Ver todas" lleva a la lista filtrada.
  - Si no hay saldos pendientes: "Nadie te debe".

## Perfil fiscal, PDF y correos

- **Perfil fiscal:** una sección "Para que te paguen".
  - **CLABE:** valida el dígito verificador y muestra el banco.
  - **Banco:** se llena solo y se puede editar.
  - **Link de pago:** opcional, debe ser https.
  - También se validan en el servidor.
- **PDF de la factura:** un bloque "Para pagar" con el vencimiento, el banco, la CLABE, el nombre del titular y el link, cuando existan.
- **Correo de la factura timbrada:** agrega el vencimiento y los datos de pago.
- **Corrección de paso:** el correo del complemento dice "USD 5,000.00 MXN" para un pago en dólares (viene del feature 4). Lo mismo pasa en el de la factura ("USD 2,500.00 USD").

## Archivos

- **Esquemas:** `clients`, `invoices` e `issuing-profiles`, y uno nuevo, `payment-reminders.schema.ts`. Migración `0014_collections.sql`.
- **`features/collections/`:**
  - `utils/collection-state.ts`, `due-date.ts`, `reminder-message.ts`, `whatsapp.ts`;
  - `services/collection.service.ts`: lo que te deben, marcar una PUE y los recordatorios;
  - acciones;
  - componentes: `collection-label`, `remind-payment-dialog`, `pue-collection-talon` y `owed-section`.
- **`features/fiscal-profile/`:** `utils/clabe.ts`, `data/spei-institutions.json` y la sección "Para que te paguen".
- **Se modifican:**
  - `invoice-form`, `invoice-detail`, `invoice-list`, `invoice-row` e `invoice-pdf-document`;
  - `invoice.service` (timbrado, copia y corrección a PPD);
  - `client-form` y su esquema;
  - `payment-amounts`, `email.service` y las plantillas de correo;
  - el Inicio.

## Orden de implementación

5.1 y 5.4 (esquema, cliente, perfil y formulario) → 5.2 (estado y detalle) → 5.3 (lista e Inicio) → 5.5 y 5.6 (recordatorios) → PDF y correos.

## Casos de prueba

1. **Estado de cobro:**
   - PPD sin cobros: sin fecha, por cobrar; con fecha pasada, vencida; parcial; cobrada;
   - PUE: cobrada; marcada dentro del mes, por cobrar; marcada pasado el mes, vencida y por sustituir;
   - borrador, cancelada, en cancelación y sustituida: sin estado.
2. **Fechas:**
   - 2026-10-20 + 30 días = 2026-11-19;
   - fin de mes de un 2026-02-10 = 2026-02-28 (y 2028-02-29);
   - un timbrado a las 23:30 en la Ciudad de México cuenta ese día.
3. **CLABE:**
   - `032180000118359719` es válida;
   - con otro dígito final, o con letras, es inválida;
   - `012…` da BBVA MEXICO.
4. **WhatsApp:**
   - "442 123 4567" → `524421234567`;
   - "+1 (415) 555-0100" → `14155550100`;
   - sin teléfono → `wa.me/?text=`.
5. **Mensaje:** vencida, por vencer, sin fecha, parcial, en USD y sin datos de pago.
6. **Base:**
   - la migración;
   - "Te deben" con A-1 (PPD, saldo $5,408.33) y una PUE marcada por cobrar;
   - el límite de un correo al día.
7. **Navegador** (375, 768 y 1280 px, claro y oscuro):
   - días de crédito en el cliente y en la factura, con sus avisos;
   - la CLABE con su banco y su error;
   - el talón PPD y la PUE por cobrar;
   - el diálogo de recordatorio;
   - los filtros de la lista;
   - "Te deben".
8. **Correo:** un recordatorio de prueba a tu buzón, con permiso.
9. **Con timbres de SW:** el vencimiento al timbrar y el PDF con "Para pagar". Mientras no haya timbres, el PDF se revisa a partir de una copia en memoria, como el del feature 4.

## Fuentes

- RMF 2026, regla 2.7.1.39 "Opción para que en el CFDI se establezca como método de pago «Pago en una sola exhibición»" (DOF del 28 de diciembre de 2025, p. 117).
- Banxico, lista de instituciones del SPEI del servicio del CEP (`https://www.banxico.org.mx/cep/instituciones.do`), consultada el 2026-10-20.
- WhatsApp, "Cómo usar la función de clic para chatear" (`https://faq.whatsapp.com/5913398998672934`).
