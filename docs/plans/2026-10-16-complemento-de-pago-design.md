# Complemento de pago (REP) con "Registrar cobro"

**Fecha:** 2026-10-16
**Estado:** Aprobado e implementado el 2026-10-19. Las diferencias con este diseño están en `PLAN-FEATURES.md`, feature 1, "Decisiones":
- `paid_on` es tipo fecha y se agregó `qr_code`;
- reintento seguro con el 307 de SW;
- el PDF se arma desde el XML;
- "Cancelar factura" pasó al menú ⋯;
- los cobros van en el talón de la hoja.
**Plan:** feature 1 de `PLAN-FEATURES.md`

## Objetivo

En una factura PPD timbrada, el usuario registra un cobro (total o parcial). La app timbra en ese momento el complemento de pago 2.0 con los impuestos y retenciones proporcionales, lo guarda en R2, se lo manda al cliente y actualiza el saldo de la factura.

## Alcance de la primera versión

**Entra:**
- Un cobro por factura, en pesos, total o en parcialidades.
- Historial de cobros y saldo en el detalle de la factura, y el saldo en la lista.
- XML y PDF del REP, y correo al cliente.
- Bloquear la cancelación de una factura que tiene REP vigentes.

**No entra (y en qué feature va):**
- Cancelar o sustituir un REP: feature 2, porque necesita el estatus de cancelación del SAT.
- Un cobro que salda varias facturas: el modelo ya lo permite, falta la interfaz.
- Facturas en dólares: feature 4.
- Marcar como cobrada una PUE sin REP: feature 5.
- Sustituir un REP con `CfdiRelacionados`: feature 2.

## Decisión: tablas propias para los cobros

El plan proponía guardar el CFDI de pago como fila de `invoices` con una columna `cfdiType`. Al revisar el código, se propone en su lugar dos tablas nuevas, `payments` y `payment_documents`. Razones:

- **`invoices` asume el tipo I en muchos lugares.** Habría que filtrar el tipo en:
  - la lista (`getInvoices`);
  - el Inicio (cinco consultas en `dashboard.service.ts`);
  - `getRecentInvoices`;
  - editar, borrar, duplicar y `stampInvoice`.

  Además, `paymentForm` y `paymentMethod` son `NOT NULL` y se usan como texto en toda la app. Un filtro olvidado mete los REP en totales y listas.
- **El modelo calca el XML.** `payments` es el nodo `Pago` y `payment_documents` es cada `DoctoRelacionado`. Cobranza (5) y Tu mes (7) leen de ahí lo cobrado.
- **Se reutilizan las piezas de bajo nivel:** `sealXml`, `stampInvoice` y `cancelInvoice` de `sw-client.service.ts`, `uploadFile`, `getInvoiceDownloadUrlAction`, `consumeStamp` y `refundStamp`. Lo que se repite es la orquestación: unas 100 líneas, parecidas a `stampInvoice`.
- **Las notas de crédito (10) siguen en `invoices`.** Son tipo E, con conceptos, y no chocan con esto.

## Modelo de datos

Va en un esquema nuevo, `database/schemas/payments.schema.ts`, y en la migración `0010_payments.sql`.

```ts
export const paymentStatusEnum = pgEnum('payment_status', ['en_timbrado', 'timbrado', 'cancelado'])

// Nodo Pago + el CFDI tipo P que lo ampara
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  issuingProfileId: uuid('issuing_profile_id').notNull(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  serie: varchar('serie', { length: 25 }).notNull().default('P'),
  folio: integer('folio').notNull(),
  paidOn: date('paid_on', { mode: 'string' }).notNull(),                    // FechaPago (día; la hora va en el XML)
  paymentForm: varchar('payment_form', { length: 2 }).notNull(),           // FormaDePagoP, nunca 99
  currency: varchar('currency', { length: 3 }).notNull().default('MXN'),   // MonedaP
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),        // Monto
  operationNumber: varchar('operation_number', { length: 100 }),           // NumOperacion
  status: paymentStatusEnum('status').notNull().default('en_timbrado'),
  stampingStartedAt: timestamp('stamping_started_at', { withTimezone: true }),
  issuedAt: timestamp('issued_at', { withTimezone: true }),                // Fecha del REP
  uuid: varchar('uuid', { length: 36 }),
  xmlContent: text('xml_content'),
  xmlUrl: text('xml_url'),
  pdfUrl: text('pdf_url'),
  satCertificateNumber: text('sat_certificate_number'),
  cfdiSignature: text('cfdi_signature'),
  satSignature: text('sat_signature'),
  satOriginalChain: text('sat_original_chain'),
  qrCode: text('qr_code'),
  stampedAt: timestamp('stamped_at', { withTimezone: true }),
  cancellationReason: varchar('cancellation_reason', { length: 2 }),
  cancellationAcuseUrl: text('cancellation_acuse_url'),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex('payments_profile_serie_folio_idx').on(t.issuingProfileId, t.serie, t.folio)])

// Nodo DoctoRelacionado: la factura que salda el cobro
export const paymentDocuments = pgTable('payment_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  installment: integer('installment').notNull(),                                 // NumParcialidad
  previousBalance: numeric('previous_balance', { precision: 15, scale: 2 }).notNull(),   // ImpSaldoAnt
  amountPaid: numeric('amount_paid', { precision: 15, scale: 2 }).notNull(),             // ImpPagado
  remainingBalance: numeric('remaining_balance', { precision: 15, scale: 2 }).notNull(), // ImpSaldoInsoluto
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('payment_documents_invoice_idx').on(t.invoiceId)])
```

- **Saldo de una factura:** `total − Σ amountPaid` de sus documentos, contando solo los pagos `en_timbrado` o `timbrado`.
- **`NumParcialidad`:** el número de esos pagos más 1. Como solo se puede cancelar el último REP, la numeración no queda con huecos.
- **Impuestos del documento relacionado:** no se guardan. Se calculan desde la factura (sus tasas y montos timbrados) al armar el XML. El PDF del REP los lee de su propio XML.

## Cálculo

Función pura en `features/payments/utils/payment-amounts.ts`. Recibe:
- de la factura: total, base, tasas e importes;
- del cobro: `ImpSaldoAnt` e `ImpPagado`.

Devuelve `ImpSaldoInsoluto`, los `ImpuestosDR`, los `ImpuestosP` y los `Totales`. Las fuentes de cada regla están al final del documento.

**Saldos y monto**
- En el primer cobro, `ImpSaldoAnt` es igual al total de la factura.
- `ImpSaldoInsoluto = ImpSaldoAnt − ImpPagado`, y no puede ser negativo.
- En pesos, `Monto` es igual a `ImpPagado`. Con una sola moneda no hay tolerancia: la suma de `ImpPagado` no puede pasar de `Monto` (CRP20217).
- Todos llevan 2 decimales.

**Impuestos del documento relacionado (`ImpuestosDR`)**
- El pago se aplica proporcionalmente a los conceptos (RMF 2.7.1.32). El SAT no escribe la fórmula; la que usamos es la habitual:
  - `factor = ImpPagado / Total de la factura`;
  - `BaseDR = round2(base de la factura × factor)`;
  - `ImporteDR = round2(BaseDR × TasaOCuotaDR)`.
- Hay un `RetencionDR` por cada retención (ISR `001` a 0.012500 e IVA `002` a 0.106667) y un `TrasladoDR` de IVA `002` a 0.160000. Se agrupa por impuesto, tipo de factor y tasa; hoy todos los conceptos comparten tasas.
- `BaseDR` debe ser mayor que 0.
- **Tolerancia del PAC** (CRP20254 y CRP20261), con d = decimales escritos en `BaseDR`:
  - límite inferior = `(BaseDR − 10^−d/2) × tasa`, truncado;
  - límite superior = `(BaseDR + 10^−d/2 − 10^−12) × tasa`, redondeado hacia arriba;
  - ambos se cortan a los decimales de `ImporteDR`.

  Con 2 decimales en ambos, `round2(BaseDR × tasa)` siempre queda dentro.
- No se ajusta la última parcialidad para que la suma de bases cuadre al centavo. Ninguna validación lo pide, y el redondeo puede dejar ±0.01.

**`ImpuestosP`**
- `RetencionP`: uno por impuesto, con `ImporteP = Σ ImporteDR / EquivalenciaDR` (CRP20263 y CRP20265).
- `TrasladoP`: uno por impuesto, tipo de factor y tasa, con `BaseP = Σ BaseDR / EquivalenciaDR` e `ImporteP = Σ ImporteDR / EquivalenciaDR` (CRP20268, CRP20271 y CRP20274).
- En pesos, `EquivalenciaDR` es 1 y son sumas exactas.

**`Totales`** (en pesos, 2 decimales, redondeo de la suma)
- `MontoTotalPagos = round2(Σ Monto × TipoCambioP)`. Es obligatorio.
- `TotalRetencionesISR` y `TotalRetencionesIVA = round2(Σ ImporteP de la RetencionP × TipoCambioP)`.
- `TotalTrasladosBaseIVA16` y `TotalTrasladosImpuestoIVA16 = round2(Σ BaseP o ImporteP del TrasladoP de IVA a 0.160000 × TipoCambioP)`.
- Se omiten si no hay ese impuesto, y deben estar si lo hay (CRP20264, CRP20267 y CRP20273).

**Vectores de prueba para 1.3**
- **Factura del 1.1** (subtotal 10,999.99; IVA 1,760.00; ISR 137.50; IVA retenido 1,173.34; total 11,449.15), pago total: `BaseDR` 10,999.99; IVA 1,760.00; ISR 137.50; IVA retenido 1,173.34; saldo 0.00.
- **Factura de 10,000 + IVA con retenciones RESICO** (total 10,408.33), pago de 5,000.00:

  | Concepto | Valor | Rango que acepta el PAC |
  |---|---|---|
  | `BaseDR` | 4,803.84 | — |
  | IVA trasladado | 768.61 | 768.61–768.62 |
  | ISR retenido | 60.05 | 60.04–60.05 |
  | IVA retenido | 512.41 | 512.41–512.42 |
  | `ImpSaldoInsoluto` | 5,408.33 | — |

  Base + IVA − retenciones da 4,999.99, no 5,000.00. Ninguna validación lo exige.
- **Ejemplo del SAT** (guía, apéndice 9; factura de 175,000 + IVA = 203,000), pago de 180,670.00: `BaseDR` 155,750.00 e IVA 24,920.00.

## Flujo "Registrar cobro"

1. **Validar:**
   - la factura es del usuario, PPD, timbrada, con UUID y con saldo;
   - el monto es mayor que 0 y no supera el saldo;
   - la fecha de pago no es futura. El PAC no lo valida, pero la guía del SAT lo pide: `FechaPago` es menor o igual que la `Fecha` del REP;
   - la forma de pago no es 99.
2. **Reservar, en una transacción:**
   - `SELECT … FOR UPDATE` de la factura, para que dos cobros simultáneos no tomen el mismo saldo;
   - calcular el saldo y la parcialidad;
   - si hay un pago `en_timbrado` de menos de 2 minutos, responder "Ya se está registrando un cobro";
   - insertar `payments` (`en_timbrado`, con el siguiente folio de la serie P del perfil) y `payment_documents`;
   - `consumeStamp`. Si no hay timbres, la transacción se aborta.
3. **Timbrar:** armar el XML (`payment-xml-builder.service.ts`), sellarlo y mandarlo a SW.
4. **Si SW rechaza:** borrar el pago (los documentos se borran en cascada) y devolver el timbre, en una transacción. Mostrar el motivo del error.
5. **Si SW acepta:**
   - guardar el UUID, el XML y los sellos, con estado `timbrado`;
   - después, como hace `stampInvoice`: XML y PDF a R2 y correo al cliente (sin bloquear).
6. **Reintento seguro (verificar):** confirmar si SW regresa el timbre previo cuando se reenvía el mismo XML sellado. Si es así, guardar el XML sellado antes de llamar a SW, y así un reintento no duplica el REP.

## XML del REP

Nuevo `features/stamping/services/payment-xml-builder.service.ts`:

- **Comprobante:**
  - `TipoDeComprobante="P"`, `SubTotal="0"`, `Total="0"`, `Moneda="XXX"`, `Exportacion="01"`;
  - `LugarExpedicion` es el código postal del perfil;
  - sin `FormaPago` ni `MetodoPago`, y sin nodo `Impuestos`;
  - `Serie` y `Folio` del pago.
- **Emisor:** el perfil de la factura. **Receptor:** el cliente con sus datos actuales, con `UsoCFDI="CP01"`.
- **Concepto:** `84111506`, `Cantidad="1"`, `ClaveUnidad="ACT"`, `Descripcion="Pago"`, `ValorUnitario="0"`, `Importe="0"` y `ObjetoImp="01"`. Se escribe con etiqueta de cierre (`></cfdi:Concepto>`), porque `buildCadenaOriginal` solo reconoce conceptos con cierre.
- **Complemento:** `pago20:Pagos`, en el orden del XSD:
  - `Totales`;
  - `Pago`, con `FechaPago` igual al día elegido a las 12:00:00, `MonedaP="MXN"` y `TipoCambioP="1"` (sin decimales, CRP20215);
  - `DoctoRelacionado`, con `IdDocumento`, `Serie`, `Folio`, `MonedaDR`, `EquivalenciaDR="1"` (CRP20238), `NumParcialidad`, los saldos, `ObjetoImpDR="02"` y su `ImpuestosDR` (retenciones antes que traslados; con `ObjetoImpDR="02"` es obligatorio, CRP20246);
  - `ImpuestosP`.
- **Namespace:** `xmlns:pago20="http://www.sat.gob.mx/Pagos20"`, y su par en `xsi:schemaLocation`.

`xml-seal.service.ts` agrega al final de la cadena original la secuencia de `Pagos20.xslt` cuando existe `pago20:Pagos` (el orden está en el plan, en "Confirmado").

## Cancelación: pasa al feature 2

- **Requiere aceptación.** Cancelar un REP pide que el cliente acepte: la RMF 2026, regla 2.7.1.35, fracción I, excluye a los REP de la cancelación sin aceptación de hasta $1,000.
  - La excepción es cancelarlo a más tardar el día hábil siguiente a su emisión (fracción IX).
  - Si no, el cliente tiene 3 días, y su silencio cuenta como aceptación (regla 2.7.1.34).

  Marcar `cancelado` en cuanto SW acepta la solicitud sería falso, igual que pasa hoy con las facturas. Por eso cancelar y sustituir un REP se hace en el feature 2, que trae la consulta del estatus al SAT.
- **Al implementarlo:**
  - solo se cancela el último REP de cada factura;
  - la sustitución (`TipoRelacion="04"` y motivo 01) repite la parcialidad, la fecha de pago y los saldos, y cambia solo el dato equivocado. Esto es práctica común, no regla del SAT.
- **Lo que sí entra en este feature:** no se puede cancelar una factura que tiene REP vigentes. El SAT exige cancelar primero los CFDI relacionados (regla 2.7.1.34). `cancelInvoice` y el diálogo lo bloquean con un mensaje claro.

## Interfaz

- **Detalle de una factura PPD timbrada:**
  - en la hoja, la sección "Cobros": un renglón por REP con parcialidad, fecha de pago, forma, monto, saldo después, UUID corto y estado;
  - al final, "Saldo pendiente";
  - en las acciones de la página, "Registrar cobro" mientras haya saldo.
- **Diálogo "Registrar cobro":**
  - campos: fecha de pago (hoy por defecto), forma de pago (combobox sin 99), monto (el saldo por defecto) y número de operación (opcional);
  - abajo: "Parcialidad 2 de esta factura", "Saldo después del cobro" y "Usará 1 timbre; te quedan N";
  - si el pago fue de un mes anterior y ya pasó el día 5, un aviso de que el plazo venció.
- **Acciones de cada REP:** XML y PDF. Cancelar llega con el feature 2.
- **Cancelar factura:** si la factura tiene REP vigentes, el diálogo explica que primero hay que cancelar sus complementos de pago, y no deja continuar.
- **Lista de facturas:** las PPD con saldo muestran "Saldo $X"; las saldadas, "Pagada".

## PDF y correo

- **PDF:** `features/payments/components/payment-pdf-document.tsx`, con la identidad Talonario del PDF de factura (folio en tinta roja, sello, QR y timbre). Contiene los datos del pago, la factura relacionada con su parcialidad y saldos, y los impuestos.
- **Generación:** `generatePaymentPdf` en `pdf-generator.service.ts`.
- **Correo:** plantilla `payment-stamped.tsx` en `features/notifications/email/templates/`.

## Archivos

- **Nuevos:**
  - `database/schemas/payments.schema.ts` (más relaciones e `index.ts`);
  - `features/payments/` con `services/payment.service.ts`, `actions/`, `components/`, `utils/payment-amounts.ts`, `types/` y `schemas/`;
  - `features/stamping/services/payment-xml-builder.service.ts`.
- **Cambian:**
  - `features/stamping/services/xml-seal.service.ts`;
  - `features/storage/services/pdf-generator.service.ts`;
  - `features/notifications/services/email.service.ts`;
  - `features/invoicing/components/invoice-detail.tsx` e `invoice-row.tsx`;
  - `features/invoicing/services/invoice.service.ts` (saldo en la lista).

## Casos de prueba

1. **Cálculo**, con la factura del 1.1 (total 11,449.15):
   - pago total: saldo 0, y los impuestos del documento iguales a los de la factura;
   - dos parcialidades (5,000.00 y 6,449.15): bases e importes proporcionales, y saldos 6,449.15 y 0.00;
   - una factura sin retenciones.
2. **Sandbox en seco:** REP del pago total y de las dos parcialidades contra el UUID `e50d5d26-…`. SW debe aceptarlos.
3. **En la app** (necesita un perfil 626 de prueba; pedir permiso): registrar dos cobros parciales y ver el PDF, el correo y el saldo. Después, intentar cancelar la factura y ver que se bloquea.
4. **Errores:**
   - monto mayor que el saldo, forma 99 y fecha futura;
   - sin timbres: no se consume ninguno;
   - SW rechaza: no queda pago y se devuelve el timbre;
   - doble clic: un solo REP.

## Fuentes

Revisadas por el agente de investigación el 2026-10-16. El complemento vigente es Pagos 2.0 revisión B, desde el 15 de enero de 2024.

- [Guía de llenado del complemento de pagos (SAT, revisión del 16 de enero de 2026)](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_llenado_pagos.pdf): saldos, fechas y ejemplo del apéndice 9.
- [Estándar Pagos 2.0 revisión B](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Complemento_de_Pagos20_RevB.pdf): validaciones de las páginas 50 a 66, incluidas las tolerancias de `ImporteDR`.
- [Matriz de errores CFDI 4.0](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/MatrizDeErrores_CFDI_v40_20260325.xls): CFDI40141 y CFDI40201.
- [RMF 2026 (DOF del 28 de diciembre de 2025)](https://dof.gob.mx/2025/SHCP/SHCP_281225_01.pdf): reglas 2.7.1.32 (plazo, día 5), 2.7.1.34 y 2.7.1.35 (cancelación).
- [`Pagos20.xsd`](http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd) y [`Pagos20.xslt`](http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xslt): estructura y orden de la cadena original.
- [Finkok, ajustes a las validaciones de pagos 2.0](https://support.finkok.com/support/solutions/articles/31000170307-ajustes-validaciones-complemento-pagos-2-0): el SAT acepta `ImpuestosP` redondeados.

Sin fuente oficial:
- la fórmula exacta de `BaseDR`, que es la práctica habitual;
- qué hacer con la parcialidad al sustituir un REP;
- si la exclusión de los REP en la regla 2.7.1.35 es nueva en 2026.
