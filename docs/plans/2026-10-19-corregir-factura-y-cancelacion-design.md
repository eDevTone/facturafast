# Corregir factura y estatus de cancelación

**Fecha:** 2026-10-19
**Estado:** aprobado por el usuario el 2026-10-19 y programado ese mismo día. Faltan las pruebas que timbran, porque la cuenta de pruebas de SW no tiene timbres (ver `PLAN-FEATURES.md`). Lo que cambió respecto a este diseño:
- `payments` también lleva índice en `related_uuid`;
- los avisos van entre el título y la hoja;
- la columna de estatus de la lista mide 136 px;
- mientras un cobro que cuenta para el saldo está en cancelación, no se registra otro (`CANCELLATION_PENDING`).
**Plan:** feature 2 de `PLAN-FEATURES.md`

## Objetivo

- **Corregir en un paso.** En una factura timbrada, "Corregir factura" abre un borrador igual, ligado a la original. Al timbrarlo, la app pide al SAT cancelar la original con el motivo 01 y el UUID nuevo como folio de sustitución.
- **Estatus real de la cancelación.** Hoy `cancelInvoice` marca `cancelada` en cuanto SW recibe la solicitud. Con este cambio, la factura queda "En cancelación" hasta que el SAT lo confirme, y la app muestra si el cliente aceptó, rechazó o dejó pasar el plazo.
- **Cancelar y corregir un REP**, que viene del feature 1.

## Alcance

**Entra:**
- "Corregir factura" en facturas timbradas sin cancelación en proceso ni REP vigentes.
- `CfdiRelacionados` en el XML de factura y de REP, y su lugar en la cadena original.
- Consulta del estatus al SAT:
  - antes de cancelar, para saber si el cliente tendrá que aceptar;
  - justo después de pedir la cancelación;
  - al abrir el detalle o la lista;
  - con el botón "Actualizar estatus".
- Sellos "Por cancelar", "En cancelación" y "Cancelación rechazada".
- Cancelar y corregir el último REP de una factura.

**No entra:**
- Aceptar o rechazar las cancelaciones que te piden tus proveedores, cuando tú eres el receptor. Eso se hace en el buzón tributario.
- Avisar por correo cuando el SAT resuelve una cancelación: necesita el cron del feature 6.
- Corregir una factura PPD con REP vigentes. SW dice que el SAT pasa los REP a la factura nueva, pero los saldos de la app tendrían que moverse con ellos. Por ahora, primero se cancelan sus REP, del último al primero.
- Sustituir varias facturas con una sola, o una con varias.

## Reglas confirmadas

Investigadas el 2026-10-19 en fuentes oficiales; las de SW, en su documentación. Detalle en "Fuentes".

**Sustitución y motivos**
- **Orden:** primero se timbra la nueva con `CfdiRelacionados TipoRelacion="04"` hacia la original. Después se cancela la original con el motivo 01 y el UUID nuevo como `FolioSustitucion`. El SAT valida que exista esa relación (preguntas frecuentes de cancelación 2026, preguntas 2 y 7; manual de usuario de cancelación, p. 10).
- **"No cancelable" es normal:** al timbrarse la nueva, la original aparece "No cancelable". El vínculo se rompe al pedir la cancelación con 01, y la original pasa a cancelable con o sin aceptación (preguntas frecuentes, escenario 1).
- **Qué se puede corregir con 01:** montos, claves y cualquier otro dato.
- **RFC del cliente equivocado:** el SAT pide cancelar primero con 02 y después emitir la correcta, relacionada con 04 (pregunta 9 y escenario 2).
- **Si el 01 no procede:** se cancelan con 02 la original y la que la sustituye, y se emite otra relacionada con 04 (pregunta 3).
- **Sin aceptación** (RMF 2026, regla 2.7.1.35). Entre otros supuestos:
  - hasta $1,000, salvo los REP (fracción I);
  - egresos y traslados;
  - público en general y residentes en el extranjero;
  - cuando la cancelación se hace "dentro del día hábil siguiente a su expedición" (fracción IX). Las preguntas frecuentes todavía dicen "24 horas".
- **Con aceptación** (regla 2.7.1.34 y preguntas 13 a 15):
  - el cliente tiene 3 días hábiles;
  - si no responde a la primera solicitud, se cancela;
  - si ya rechazó una, las siguientes solo proceden si acepta. Sin respuesta, queda "Plazo vencido" y sigue vigente;
  - no hay límite de solicitudes (manual, p. 4).
- **CFDI relacionados:** un CFDI con relacionados vigentes no se cancela hasta cancelarlos, salvo con el motivo 01 (regla 2.7.1.34, quinto párrafo; presentación del servicio de cancelación, p. 4).
- **Plazo:** a más tardar en el mes en que se presenta la declaración anual del ejercicio en que se expidió (CFF, art. 29-A, cuarto párrafo). Es abril del año siguiente para personas físicas y marzo para morales.

**XML**
- `CfdiRelacionados` se puede repetir y va entre `InformacionGlobal` y `Emisor`.
- En la cadena original, por cada nodo, `TipoRelacion` y cada `UUID`, después de los datos de `InformacionGlobal` y antes de los del emisor (`cfdv40.xsd`; Anexo 20, pp. 11 y 68).
- El PAC no valida que el UUID relacionado exista (matriz de errores CFDI 4.0).
- Una factura tipo I puede sustituir a una I o E (guía de llenado del Anexo 20, p. 14).

**REP** (guía de llenado de pagos, pp. 11 y 67; esquema de cancelación 2026, p. 7)
- Solo usa la relación 04.
- Se corrige timbrando el sustituto con 04 y cancelando el anterior con 01.
- Siempre pide aceptación, sin importar el monto, salvo por otra fracción, como la IX.

**SW y la consulta del SAT** (documentación de SW y pruebas del 2026-10-19)
- **Respuesta de `cancel/csd`:** trae `data.acuse` y `data.uuid`, que asocia cada UUID con un código:
  - 201: solicitud recibida, con o sin aceptación; no significa cancelada;
  - 202: ya estaba cancelada;
  - otros (205, 207, 208, 212, 3xx): pueden llegar dentro de una respuesta `success`. **Hoy `cancelInvoice` los tomaría como éxito.**
- **Recién timbrado:** el SAT puede tardar en tener un CFDI. SW habla de hasta 48 h, y Finkok ve el 205 al cancelar justo después de timbrar.
- **Costo:** cancelar no gasta timbres de SW, según su sitio. Se comprueba con `GET /management/v2/api/users/balance` (`stampsUsed` antes y después).
- **Consulta:**
  - SOAP 1.1 a `ConsultaCFDIService.svc`, con `SOAPAction: http://tempuri.org/IConsultaCFDIService/Consulta`;
  - expresión `?re=…&rr=…&tt=…&id=…&fe=…`;
  - `tt` sin ceros de más: `11449.15`, `1000.0` (Anexo 20, p. 67);
  - un `&` del RFC va como `&amp;`;
  - responde `CodigoEstatus`, `Estado`, `EsCancelable`, `EstatusCancelacion` y `ValidacionEFOS`.
- **Ambiente de pruebas:**
  - el servicio de pruebas del SAT ya no existe;
  - SW tiene una copia sin token en `https://api.test.sw.com.mx/ConsultaCFDIService.svc` que conoce las facturas del sandbox. La `e50d5d26-…` sale "Vigente" y "Cancelable con aceptación";
  - producción responde 602 ("no encontrado") para los UUID del sandbox.

## Modelo de datos

La migración `0011_cancellation_status.sql` es aditiva: un tipo nuevo y columnas que aceptan nulos. No toca datos existentes.

```ts
// database/schemas/invoices.schema.ts
export const cancellationStatusEnum = pgEnum('cancellation_status', ['en_proceso', 'rechazada'])

// Columnas nuevas de invoices
/** c_TipoRelacion del nodo CfdiRelacionados; '04' cuando sustituye a otra factura. */
relationType: varchar('relation_type', { length: 2 }),
/** UUID del CFDI relacionado (el que sustituye). */
relatedUuid: varchar('related_uuid', { length: 36 }),
/** Solicitud de cancelación pendiente; null si no hay. La factura sigue `timbrada` hasta que el SAT la cancela. */
cancellationStatus: cancellationStatusEnum('cancellation_status'),
cancellationRequestedAt: timestamp('cancellation_requested_at', { withTimezone: true }),
/** UUID de la factura que la sustituye; se guarda al timbrar la sustituta y viaja como FolioSustitucion. */
cancellationSubstituteUuid: varchar('cancellation_substitute_uuid', { length: 36 }),
/** Última respuesta de la consulta al SAT. */
satCancellable: varchar('sat_cancellable', { length: 40 }),                // EsCancelable
satCancellationStatus: varchar('sat_cancellation_status', { length: 40 }), // EstatusCancelacion
satCheckedAt: timestamp('sat_checked_at', { withTimezone: true }),
// Índice para encontrar la factura que sustituye a otra
index('invoices_related_uuid_idx').on(table.relatedUuid),
```

- **`payments`:** lleva las mismas columnas, salvo `relationType`, porque un REP solo se relaciona con 04.
- **Sin cambios:** `cancellationReason`, `cancellationAcuseUrl`, `cancelledAt` y `status`. `status` pasa de `timbrada` a `cancelada` solo cuando el SAT lo confirma.
- **Por qué un estatus aparte, y no valores nuevos en `invoice_status`:**
  - una factura en proceso de cancelación sigue vigente ante el SAT. Con un estatus aparte, el Inicio, la lista y los totales la siguen contando sin cambiar ninguna consulta;
  - `ALTER TYPE ... ADD VALUE` no deja usar el valor nuevo en la misma transacción.
- **Por qué columnas, y no una tabla de solicitudes:** basta con la última solicitud, y así la lista y los sellos leen todo de la misma fila.

### Estados

| `status` | `cancellationStatus` | Sello | El detalle dice |
|---|---|---|---|
| `timbrada` | — | Timbrada | — |
| `timbrada` | — (con `cancellationSubstituteUuid`) | Por cancelar (ocre) | "La sustituiste con la A-5, pero falta que el SAT reciba su cancelación." Muestra el motivo del error, con el botón "Pedir cancelación". |
| `timbrada` | `en_proceso` | En cancelación (ocre) | Si pide aceptación: "Pediste cancelarla el 19 de octubre. Tu cliente tiene 3 días hábiles para aceptar o rechazar." Si no: "El SAT está procesando la cancelación." |
| `timbrada` | `rechazada` | Cancelación rechazada (ocre) | "Tu cliente rechazó la cancelación (o no respondió a una segunda solicitud). La factura sigue vigente." Botón "Volver a pedirla". |
| `cancelada` | — | Cancelada (rojo) | Cómo se canceló: sin aceptación, aceptada por el cliente o por plazo vencido. |

**Transiciones:**
- Al timbrarse la sustituta, la original guarda `cancellationSubstituteUuid` y se pide su cancelación en ese momento.
- SW recibe la solicitud (201 o 202) → `en_proceso`, con fecha, motivo y acuse, y se consulta al SAT.
- SW la rechaza → no cambia nada y se muestra el motivo.
- El SAT responde `Estado = Cancelado` → `status = cancelada`, con `cancelledAt`, y `cancellationStatus = null`.
- El SAT responde `Vigente` con `Solicitud rechazada` o `Plazo vencido` → `rechazada`.
- Cualquier otra respuesta (en proceso, vacía, "no encontrado" o error) no cambia el estado; solo se guarda la consulta.
- Desde `rechazada`, una nueva solicitud vuelve a `en_proceso`.

## Flujo "Corregir factura"

1. **Dónde:** en el menú ⋯ del detalle y de la lista, "Corregir factura", arriba de "Cancelar factura". Se deshabilita, con su motivo, cuando:
   - la factura tiene REP vigentes (el mismo texto de la cancelación);
   - hay una cancelación en proceso;
   - ya hay una factura timbrada que la sustituye;
   - venció el plazo para cancelarla (CFF 29-A).
2. **Diálogo corto:**
   - el texto: "Creamos un borrador igual a la A-3 para que corrijas lo que esté mal. Al timbrarlo, pediremos al SAT cancelar la A-3 con el motivo 01 (sustitución).";
   - debajo, lo que diga el SAT de la original: si el cliente tendrá que aceptar;
   - el botón "Crear borrador".
3. **Borrador:** `createCorrectionDraft` copia la factura como `duplicateInvoice` y agrega `relationType = '04'` y `relatedUuid` con el UUID de la original. Si ya hay un borrador que la corrige, abre ese.
4. **Formulario:**
   - arriba, el aviso: "Este borrador corrige la factura A-3. Al timbrarlo, pediremos al SAT cancelar la A-3.";
   - si el RFC del cliente ya no es el de la original (leído de su XML), el aviso cambia: "Cambiaste el cliente. Cuando el RFC estaba mal, el SAT pide cancelar primero la A-3 con el motivo 02." Ofrece "Cancelar la A-3".
5. **Timbrar:** el diálogo de timbrado agrega el renglón "Sustituye a A-3". `stampInvoice` decide así:
   - **mismo RFC y original timbrada:** timbra con `CfdiRelacionados`, guarda `cancellationSubstituteUuid` en la original y pide su cancelación con 01;
   - **original ya cancelada** (por ejemplo, con 02 por el RFC): timbra con la relación y no cancela nada;
   - **RFC distinto y original sin cancelar, o cancelación en proceso:** no timbra y explica qué falta.
6. **Resultado:**
   - "Factura timbrada. Pedimos al SAT cancelar la A-3", o "…y la A-3 quedó cancelada" si el SAT ya la reporta así;
   - si la cancelación falla, la nueva queda timbrada y la original queda "Por cancelar", con el motivo y el botón "Pedir cancelación". El aviso aclara que el SAT puede tardar unos minutos en registrar la nueva. No se reintenta solo al abrir páginas.

## Cancelar

- La cancelación se mueve a `features/invoicing/services/cancellation.service.ts`. `invoice.service.ts` ya pasa de 500 líneas.
- **`cancelInvoice`:**
  1. Valida: factura timbrada, sin cancelación en proceso, sin REP vigentes y dentro del plazo. Con el motivo 01, el UUID sale de la sustituta cuando existe.
  2. Llama a SW y lee el código de `data.uuid`. Solo 201 y 202 cuentan como recibida. Los demás se muestran con su clave y en palabras llanas:
     - 205: "El SAT aún no registra la factura; intenta en unos minutos";
     - 207, 208 y 212: "El SAT no encontró la relación con la factura que la sustituye";
     - 210: "Ya venció el plazo para cancelarla".
  3. Guarda `en_proceso`, la fecha, el motivo y el acuse (en R2), y consulta al SAT.
  4. Devuelve si quedó cancelada o en proceso, para el aviso.
- **Diálogo** (ver "Interfaz"): motivos en palabras llanas y lo que dice el SAT antes de confirmar.
- **El `EsCancelable` del SAT** decide si el cliente tendrá que aceptar; la app no calcula las excepciones de la RMF. Hay dos excepciones:
  - con una sustituta timbrada, "No cancelable" es lo esperado y no bloquea el motivo 01;
  - el plazo del CFF 29-A se revisa antes, para no mandar una solicitud que el SAT va a rechazar.

## Consulta del estatus al SAT

- **Servicio:** `features/stamping/services/sat-status.service.ts`, con `getSatCfdiStatus({ issuerRfc, receiverRfc, total, uuid, sealTail })`.
  - Hace la llamada SOAP con `fetch` y lee la respuesta con expresiones regulares, como el resto del código, sin dependencias nuevas.
  - Tolera las diferencias de la copia de SW: compara por prefijo (`S -`, `N - 602`), sin distinguir mayúsculas, y acepta `i:nil`.
  - Tiempo máximo: 10 s.
  - Los RFC, el `Total` y el final del `Sello` (`fe`) se leen del XML timbrado, para que coincidan con lo que tiene el SAT.
- **URL:** `SAT_STATUS_URL` si existe. Si no, la copia de pruebas de SW cuando `SW_URL` es el sandbox, y la del SAT en producción. Así, el sandbox y la consulta siempre van juntos sin tocar `.env.local`.
- **Lógica**, en `cancellation.service.ts`:
  - `applySatStatus(row, answer)`: función pura que decide la transición; se prueba con respuestas grabadas;
  - `refreshCancellationStatus(invoiceId, userId)`;
  - `refreshPendingCancellations(userId)`: hasta 10 facturas en proceso cuya última consulta tenga más de 10 minutos;
  - `getCancellationPreview(invoiceId, userId)`: el `EsCancelable` y el plazo, para los diálogos.
- **Cuándo se consulta:**
  - al abrir el diálogo de cancelar o de corregir;
  - justo después de que SW recibe la solicitud;
  - al abrir el detalle de una factura en proceso, si la última consulta tiene más de un minuto. El detalle se pinta con lo guardado y se actualiza solo;
  - al abrir la lista, en segundo plano;
  - con el botón "Actualizar estatus".
- **Si el SAT no contesta o no encuentra el CFDI:** se dice "No pudimos consultar al SAT; intenta en unos minutos" y no cambia nada.

## XML

- `buildCfdiXml` y `buildPaymentXml`, cuando hay relación, escriben `<cfdi:CfdiRelacionados TipoRelacion="04"><cfdi:CfdiRelacionado UUID="…"/></cfdi:CfdiRelacionados>`. Va justo después de abrir `cfdi:Comprobante` (aún no usamos `InformacionGlobal`) y antes de `cfdi:Emisor`.
- `buildCadenaOriginal` agrega `TipoRelacion` y cada `UUID` después de los atributos del comprobante. Cuando llegue `InformacionGlobal` (feature 11), sus datos irán antes.
- El PDF de la factura y el del REP muestran el CFDI relacionado: "04 Sustitución de los CFDI previos" y su UUID.

## Cancelar y corregir un REP (2.9)

- **Solo el último REP de cada factura**, timbrado y sin cancelación en proceso. Así la numeración de parcialidades y los saldos no se rompen.
- **"Cancelar cobro":**
  - motivos 02 ("Tenía errores y no lo voy a sustituir") o 03 ("El cobro no ocurrió");
  - casi siempre pide aceptación, y el diálogo lo dice;
  - mientras está en proceso, el cobro sigue contando (sigue vigente) y "Registrar cobro" se oculta con la explicación;
  - cuando el SAT confirma, el pago pasa a `cancelado` y su monto vuelve al saldo.
- **"Corregir cobro":**
  - el diálogo de "Registrar cobro" se abre con los datos del cobro;
  - se timbra un REP nuevo con `CfdiRelacionados` 04 hacia el anterior, con la misma `NumParcialidad` y el mismo `ImpSaldoAnt`. Esto es inferencia: no hay regla oficial. Usa 1 timbre;
  - después se pide la cancelación del anterior con 01, igual que con las facturas.
- **Saldo:** un REP que ya tiene sustituto timbrado deja de contar desde ese momento, aunque su cancelación siga en proceso. Lo aplican `summarizeBalance`, `getPaidAmountsByInvoice` y la reserva de `registerPayment`.
  - Si el cliente rechaza la cancelación, el anterior sigue vigente ante el SAT. El talón lo avisa y ofrece "Volver a pedirla".
- **Talón:**
  - el último cobro tiene un menú ⋯ con "Corregir cobro" y "Cancelar cobro";
  - los anteriores no lo tienen;
  - estados nuevos de un cobro: "Por cancelar", "En cancelación", "Cancelación rechazada", "Cancelado" (rojo) y "Sustituido por P-3" (atenuado).
- **"Cancelar factura" con REP:** sigue bloqueado, y el mensaje agrega: "Cancélalos desde Cobros, del último al primero."

## Interfaz

- **Menú ⋯ (detalle y lista):** "Copiar UUID"; después, "Corregir factura" y "Cancelar factura". Cambia según el estado:
  - en proceso: "Actualizar estatus";
  - por cancelar: "Pedir cancelación";
  - rechazada: "Volver a pedir la cancelación".
- **Diálogo de cancelar:**
  - los motivos en palabras llanas, con la clave del SAT en mono:
    - 01 "Tiene errores y ya la sustituí". Pide el UUID de la sustituta y sugiere "Corregir factura" si aún no existe;
    - 02 "Tiene errores y no la voy a sustituir (por ejemplo, el RFC del cliente estaba mal)";
    - 03 "La operación no se llevó a cabo";
    - 04 "La operación va en una factura global";
  - lo que dice el SAT, con "Consultando al SAT…" mientras tanto:
    - sin aceptación: "Se cancela sin que tu cliente tenga que aceptar";
    - con aceptación: "Tu cliente tendrá 3 días hábiles para aceptarla. Si no responde a esta primera solicitud, el SAT la cancela";
    - no cancelable: el motivo, y sin botón de confirmar;
  - "Cancelar no gasta timbres", si se confirma en 2.7.
- **Sellos:** `StatusBadge` recibe también la cancelación. "Por cancelar", "En cancelación" y "Cancelación rechazada" van en ocre. En la lista, el filtro "Timbradas" las incluye, porque siguen vigentes.
- **Hoja:**
  - **En proceso:** arriba de la hoja, un aviso ocre con la fecha de la solicitud, el plazo del cliente y "Actualizar estatus". Junto al sello azul "Timbrada" va un segundo sello, ocre y punteado, que dice "En cancelación".
  - **Por cancelar y rechazada:** el aviso ocre explica qué pasó y ofrece la acción.
  - **Cancelada:** el sello rojo agrega cómo se canceló.
  - **Relaciones:** bajo la fecha, en la banda del encabezado, "Sustituye a A-3" o "Sustituida por A-5", con liga.
- **Formulario y timbrado:** el aviso del borrador de corrección y el renglón "Sustituye a A-3" en el diálogo de timbrar.
- **Ayuda:** `invoice-help-dialog.tsx` explica "Corregir factura" y los estados de cancelación.

## Archivos

- **Nuevos:**
  - la migración `0011`, generada con `pnpm db:generate`;
  - `features/stamping/services/sat-status.service.ts`;
  - `features/invoicing/services/cancellation.service.ts`;
  - acciones `correct-invoice`, `refresh-cancellation-status` y `get-cancellation-preview`;
  - componentes `correct-invoice-dialog.tsx` y `cancellation-notice.tsx`;
  - acciones de cobros `cancel-payment` y `correct-payment`.
- **Cambian:**
  - los esquemas `invoices.schema.ts` y `payments.schema.ts`;
  - `cfdi-xml-builder.service.ts`, `payment-xml-builder.service.ts` y `xml-seal.service.ts`;
  - `sw-client.service.ts`, que además lee el código de `data.uuid`;
  - `invoice.service.ts` (`stampInvoice` y el borrador de corrección) y `payment.service.ts` (saldo, cancelar y corregir cobros);
  - componentes:
    - de facturas: `cancel-invoice-dialog`, `status-badge`, `invoice-detail`, `invoice-row`, `invoice-list`, `invoice-form`, `stamp-confirm-dialog` e `invoice-help-dialog`;
    - los dos PDF;
    - de cobros: `invoice-payments` y `register-payment-dialog`;
  - las páginas del detalle y de editar;
  - `CLAUDE.md`, con `SAT_STATUS_URL`.

## Orden de implementación

Las subtareas del plan se hacen en este orden: 2.1, 2.2, 2.4, 2.5, 2.3, 2.6, 2.7, 2.8 y 2.9. La consulta al SAT (2.4) y la nueva cancelación (2.5) van antes de "Corregir factura" (2.3), porque la usa.

## Casos de prueba

1. **Unitarios, con scripts en el scratchpad:**
   - formato de `tt` y de la expresión, con un RFC que lleva `&`;
   - lectura de respuestas grabadas: 602 de producción, y `S`, 601 y 602 de la copia de SW, con `i:nil`;
   - `applySatStatus` con cada combinación:
     - `Vigente` con estatus vacío, "En proceso", "Solicitud rechazada" y "Plazo vencido";
     - `Cancelado` sin aceptación, con aceptación y por plazo vencido;
     - "No encontrado" y error;
   - códigos de SW: 201, 202, 205 dentro de un `success` y un error 400.
2. **Sandbox en seco:** SW timbra una factura con `CfdiRelacionados` 04, lo que comprueba la cadena original.
3. **En la app, con permiso** (unos 3 timbres de prueba):
   - **Corregir con el mismo RFC:** la nueva queda timbrada con la relación y la original en proceso o cancelada. Se revisan el código de SW, el acuse, la base, los dos detalles y los PDF.
   - **Corregir cambiando el RFC:** el timbrado se bloquea hasta cancelar la original con 02.
   - **Cancelar una factura vieja del sandbox** de más de $1,000: el SAT responde "Cancelable con aceptación" y queda en proceso; el estatus sale de la copia de SW.
   - **REP:** corregir P-2 de la A-1 (P-3 con la relación y la misma parcialidad) y cancelar P-3.
4. **2.7:** el saldo de SW antes y después de una cancelación en el sandbox.
5. **Interfaz:** a 375, 768 y 1280 px, en claro y oscuro, sin errores en consola.

## Fuentes

Revisadas el 2026-10-19. Las copias están en el scratchpad de la sesión (`agent_canc_q/` y `research/`).

- [RMF 2026 (DOF del 28 de diciembre de 2025)](https://dof.gob.mx/2025/SHCP/SHCP_281225_01.pdf):
  - 2.7.1.34 "Aceptación del receptor para la cancelación del CFDI";
  - 2.7.1.35 "Cancelación de CFDI sin aceptación del receptor";
  - 2.7.2.8, fracción IX (el PAC envía el CFDI al certificarlo).

  Las dos resoluciones de modificación (DOF del 9 de julio y del 1 de octubre de 2026) no las cambian.
- [CFF, art. 29-A](https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf), cuarto párrafo, reformado en el DOF del 7 de noviembre de 2025.
- SAT, minisitio de cancelación (`sat.gob.mx/minisitio/Factura/cancela_procesocancelacion.htm`):
  - preguntas frecuentes y escenarios de cancelación 2026 (`PreguntasFrecuentes_CancelacionFactura25082026.pdf`);
  - manual de usuario de cancelación (marzo de 2025);
  - esquema de cancelación;
  - presentación del servicio de cancelación.
- [Anexo 20 y guías de llenado, revisión del 16 de enero de 2026](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm):
  - guía del CFDI, p. 14 y apéndice 7, pregunta 42;
  - guía de pagos, pp. 11, 62 y 67;
  - matrices de errores de CFDI 4.0 y de pagos.
- [Servicio de consulta de CFDI del SAT (WSDL)](https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?wsdl) y su documentación v1.4.
- [SW Sapien, desarrolladores](https://developers.sw.com.mx/):
  - cancelación CSD y códigos;
  - consulta de estatus y su copia de pruebas;
  - saldo v2;
  - preguntas 9 y 10 de cancelación;
  - base de conocimiento "Proceso de cancelación de CFDI";
  - blog "cancelación sin costo".
- Finkok, wiki `ws_cancelacion`: lista de códigos del SAT y el 205 justo después de timbrar.

**Sin fuente oficial:**
- la lista numerada de códigos de cancelación (viene de Finkok y SW);
- el retraso de hasta 48 h (SW);
- que los REP cuenten como "relacionados" que bloquean la factura (lo confirma el `EsCancelable` del SAT en cada caso);
- que el REP sustituto repita `NumParcialidad` e `ImpSaldoAnt`.
