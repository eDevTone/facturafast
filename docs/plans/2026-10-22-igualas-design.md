# Igualas automáticas

**Fecha:** 2026-10-22
**Estado:** aprobado y programado el 2026-10-22. Falta ver el modo timbrar con timbres de SW.
**Plan:** feature 6 de `PLAN-FEATURES.md`

## Objetivo

- **"Repetir cada mes"** desde una factura: el día que elijas, la app hace la factura del mes.
- **Dos modos:** dejar el borrador y avisarte, o timbrarla y mandársela al cliente.
- **La descripción cambia el mes sola:** "Diseño de redes — octubre 2026" sale el mes siguiente como "… noviembre 2026".
- **El mismo cron diario** manda los recordatorios automáticos de cobro (la 5.7, ahora 6.6), solo si los activas.

En la interfaz no se dice "iguala": la acción es "Repetir cada mes", la lista se llama "Facturas de cada mes" y la marca en las listas dice "Cada mes".

## Alcance

**Entra:** 6.1 a 6.6.

**Fuera:**

- otras frecuencias (quincenal, anual) y fecha de fin;
- recordatorios automáticos por WhatsApp: `wa.me` necesita que una persona toque "enviar".

## Reglas que ya cubre la app

- **Fecha del CFDI:** es la del timbrado; `stampInvoice` la pone (regla de las 72 horas).
- **Dólares:** `stampInvoice` toma el tipo de cambio del DOF del día (feature 4).
- **PUE con días de crédito:** queda por cobrar al timbrarse (feature 5).
- **Vercel Cron** (documentación de Vercel, actualizada entre julio y septiembre de 2026):
  - en `vercel.json`: `{"crons":[{"path":"/api/cron/daily","schedule":"0 13 * * *"}]}`;
  - Vercel hace un GET al despliegue de producción y manda `Authorization: Bearer <CRON_SECRET>`;
  - el horario siempre está en UTC; Ciudad de México es UTC−6 sin horario de verano, así que `0 13 * * *` son las 7:00;
  - en el plan Hobby corre una vez al día, con precisión de ±59 minutos (entre las 7:00 y las 7:59), y caben hasta 100 trabajos;
  - no reintenta una corrida fallida y puede entregar dos veces la misma, por eso el trabajo es idempotente.

## Modelo de datos (migración 0015)

| Tabla | Columna | Tipo | Uso |
|---|---|---|---|
| `recurring_invoices` | `id`, `user_id`, `issuing_profile_id`, `client_id` | uuid | Dueño, RFC emisor y cliente, para listar. |
| | `source_invoice_id` | uuid, nulo | La factura de la que salió (`set null` si se borra). |
| | `template` | jsonb | Copia de la factura (`CreateInvoiceInput` de `copyInvoiceInput`), con `{mes}` y `{año}` en las descripciones. |
| | `day_of_month` | smallint 1–31 | 31 significa "último día": en meses cortos corre el último día. |
| | `mode` | enum `recurring_mode` (`draft`, `stamp`) | Dejar borrador o timbrar y enviar. |
| | `period_offset` | smallint 0 o −1 | El mes de la descripción: el de la factura o el anterior. |
| | `next_run_on`, `last_run_on` | date | Próxima y última corrida (día de Ciudad de México). |
| | `active` | boolean | Pausada o activa. |
| | `created_at`, `updated_at` | timestamp | |
| `invoices` | `recurring_invoice_id` | uuid, nulo | La iguala que la generó (`set null` si se borra la iguala). |
| `invoices` | `recurring_period` | varchar(7) | `2026-11`. Índice único con `recurring_invoice_id`: una factura por mes aunque el cron corra dos veces. |
| `issuing_profiles` | `auto_reminders` | boolean, `false` | Recordatorios automáticos de cobro (6.6). |
| `payment_reminders` | `automatic` | boolean, `false` | Distingue el recordatorio automático del que mandó el usuario. |

## Flujo

1. **Crear** (detalle de una factura timbrada → "Más acciones" → "Repetir cada mes"):
   - día del mes (1 a 28 o "Último día") y modo; por omisión, el día de la factura y "Dejar borrador y avisarme";
   - si la descripción trae un mes ("octubre 2026"), se cambia por `{mes} {año}` y el diálogo lo dice: "Cada mes dirá el mes que toca". Si el mes de la descripción es el anterior al de la factura, `period_offset` = −1;
   - la primera corrida es el siguiente día elegido después de hoy, y el diálogo la muestra: "La primera sale el 1 de noviembre".
2. **Cron diario** (`/api/cron/daily`, 7:00 de Ciudad de México), para cada iguala activa con `next_run_on` ≤ hoy:
   - crea el borrador desde la plantilla, con el mes en la descripción y `recurring_period`. Si ya existe la de ese mes, no hace nada;
   - en modo timbrar llama a `stampInvoice`, que también manda la factura al cliente. Si no hay timbres o el PAC la rechaza, queda el borrador y se avisa;
   - mueve `next_run_on` al siguiente mes. Si el cron se atrasó hasta 7 días, sale la factura del mes que tocaba; con más atraso, se saltan los meses atrasados y sale la del mes en curso;
   - si el cliente o el perfil ya no existen, pausa la iguala y lo avisa.
3. **Aviso al usuario:** un correo por usuario y día, al correo de su perfil fiscal, con todo lo que se generó. Por ejemplo: "A-15, ESCUELA KEMPER URGATE: borrador listo, revísalo y timbra".
4. **Recordatorios automáticos (6.6)**, solo en perfiles con `auto_reminders` activado:
   - a cada factura por cobrar con correo del cliente, un correo el día después del vencimiento y otro a la semana. Son 2 como máximo;
   - no sale si en los últimos 3 días ya hubo un recordatorio, manual o automático;
   - usa el mensaje sugerido de la 5.6 y respeta el límite de un correo al día.
   - El interruptor va en "Para que te paguen", en el perfil fiscal.
5. **"Facturas de cada mes"** (`/invoices/recurring`, enlazada desde Facturas cuando hay alguna):
   - cada una muestra cliente, total, día, modo, próxima fecha y si está pausada;
   - acciones: pausar o reanudar; cambiar día, modo o mes de la descripción (el mismo diálogo); cambiar conceptos; borrar.
   - Borrarla no toca las facturas que ya generó.
6. **Cambiar conceptos o montos:** abre el formulario de factura en modo plantilla (`/invoices/recurring/[id]/edit`).
   - Guarda la plantilla, no una factura, y no ofrece timbrar.
   - Una nota explica `{mes}` y `{año}`.
7. **Marca:** la lista de facturas y el detalle muestran "Cada mes" en las que salieron de una iguala. El detalle dice "Se repite el día 1 de cada mes" y lleva a la lista.

## Decisiones

- **Plantilla en JSON, no un borrador escondido:** los borradores ya toman folio, y uno escondido dejaría huecos en la numeración.
- **Cron en Vercel Cron:** `STACK.md` ya contempla Vercel.
  - Es un solo trabajo diario para igualas y recordatorios, protegido con `CRON_SECRET`.
  - La ruta es un GET normal: cualquier otro programador de tareas puede llamarla con el mismo secreto.
  - `/api/cron` queda fuera de Clerk en `middleware.ts`.
- **Fecha simulada:** solo fuera de producción, la ruta acepta `?today=AAAA-MM-DD` para probar (6.5).
- **Modo por omisión:** dejar borrador. Timbrar sin revisar lo elige el usuario.

## Casos de prueba

- **Próxima fecha:**
  - días 1, 15 y 31 a lo largo del año, con febrero de 28 y de 29 días, abril (30 días) y diciembre a enero;
  - cuando hoy es justo el día elegido.
- **Mes en la descripción:**
  - "octubre 2026", "Octubre de 2026" y "octubre" solo, y una descripción sin mes;
  - mes anterior en enero: diciembre del año pasado.
- **Corrida doble el mismo día:** una sola factura.
- **Modo timbrar sin timbres:** queda el borrador y el aviso lo dice. Se prueba con el saldo de la cuenta de FacturaFast en cero, sin llegar al PAC.
- **Pausadas:** una iguala pausada no corre.
- **Seguridad de la ruta:** sin secreto o con uno equivocado responde 401.
- **Recordatorios automáticos:**
  - una factura que venció ayer recibe uno, y no recibe otro si el cron corre otra vez el mismo día;
  - no sale si hubo un recordatorio manual hace 2 días;
  - no sale si el perfil no lo activó.
- **Interfaz a 375, 768 y 1280 px:** el diálogo, la lista, el formulario en modo plantilla y la marca "Cada mes".

## Lo que no se puede probar sin timbres de SW

El modo timbrar completo: el XML, el correo al cliente y el PDF. Se prueba la parte de la app hasta llamar al PAC.
