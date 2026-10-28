# FacturaFast — plan de features

Avance de las funciones que salieron de la comparación con la competencia del 2026-10-16. El comando `/facturafast` lee este archivo, sigue con lo que toca y lo actualiza al terminar cada subtarea.

## Cómo se usa

- El estado de cada feature vive solo en la tabla de resumen: `pendiente`, `en curso`, `hecho` o `bloqueado: <motivo>`.
- Orden: fase 1, luego 2, luego 3; dentro de cada fase, de arriba abajo. Se salta un feature bloqueado o que depende de uno sin terminar.
- Una subtarea se marca `[x]` cuando está hecha y verificada.
- **(verificar)** marca una regla fiscal o técnica que hay que confirmar en la fuente oficial antes de programarla. Lo confirmado se anota en las notas del feature, con la fuente.
- Todo feature que no sea de esfuerzo bajo lleva un diseño corto en `docs/plans/` antes de programarse.
- Cada sesión deja una entrada en la bitácora, al final.

## Resumen

| # | Feature | Fase | Esfuerzo | Estado |
|---|---|---|---|---|
| 1 | Complemento de pago con "Registrar cobro" | 1 | Alto | hecho |
| 2 | Corregir factura y estatus de cancelación | 1 | Medio-bajo | bloqueado: la cuenta de pruebas de SW no tiene timbres; faltan las pruebas con timbrado (2.2, 2.3, 2.8 y 2.9) |
| 3 | Catálogo de servicios | 1 | Bajo | hecho |
| 4 | Clientes del extranjero en dólares | 2 | Medio | bloqueado: falta timbrar en el sandbox de SW (4.8) y probar Banxico con el token real (4.4) |
| 5 | Cobranza | 2 | Medio-bajo | hecho; falta verlo al timbrar (SW sin timbres) y 5.7 va con el feature 6 |
| 6 | Igualas automáticas | 2 | Medio-bajo | hecho; falta ver el modo timbrar con timbres de SW |
| 7 | Tu mes ante el SAT | 2 | Bajo-medio | en espera: la reforma RESICO 2027 (el Senado tiene hasta el 31 de octubre) |
| 8 | Paquete para tu contador | 2 | Bajo (ZIP), medio (acceso) | hecho |
| 9 | IA para la clave SAT | 2 | Bajo | descartado del MVP (2026-10-22) |
| 10 | Notas de crédito | 3 | Medio | descartado del MVP (2026-10-22); el diseño con las reglas confirmadas queda en `docs/plans/2026-10-22-notas-de-credito-design.md` |
| 11 | Factura global | 3 | Medio | descartado del MVP (2026-10-22) |
| 12 | App instalable (PWA) | 3 | Bajo | descartado del MVP (2026-10-22) |
| 13 | Bot de WhatsApp | 3 | Alto | descartado del MVP (2026-10-22) |
| 14 | Link para que el cliente capture sus datos | 3 | Bajo-medio | hecho |
| 15 | Aviso de CSD por vencer | 1 | Bajo | hecho |
| 16 | Errores del SAT en palabras simples | 1 | Bajo | hecho |

**Alcance del MVP (decidido el 2026-10-22):** los features 1 a 6, 8 y 14. El 7 espera la reforma RESICO 2027. El 9, el 10, el 11, el 12 y el 13 quedan fuera del MVP; se conservan abajo por si vuelven.

## Fase 1 — Qué agregaría (lo que hoy te hace perder usuarios)

### 1. Complemento de pago con "Registrar cobro"

- **Esfuerzo:** alto (1 a 2 semanas).
- **Depende de:** nada.
- **Por qué:** todos los competidores lo tienen y Heru lo cobra en su plan de $99/mes. Hoy, quien emite una factura PPD tiene que hacer el complemento en el portal del SAT.
- **Resultado:** en una factura PPD timbrada, "Registrar cobro" pide fecha, forma de pago y monto (acepta parcialidades) y timbra el complemento de pago 2.0 con los impuestos y retenciones proporcionales. Consume un timbre, se descarga en XML y PDF y se manda por correo. Cancelar un REP llega con el feature 2 (2.9).

**Subtareas**

- [x] 1.1 Prueba base en el sandbox de SW: timbrar una factura PPD de un emisor 626 a una persona moral, con retenciones. Se hizo en seco, con el código de la app y sin escribir en la base (ver "Confirmado"). La prueba dentro de la app (base, PDF y R2) queda en 1.10.
- [x] 1.2 Diseño y modelo de datos. El usuario aprobó el diseño (`docs/plans/2026-10-16-complemento-de-pago-design.md`) el 2026-10-19. Esquema en `database/schemas/payments.schema.ts`; la migración `0010_payments.sql` se aplicó a mano en la base Neon de pruebas el mismo día, en una transacción y con permiso.
- [x] 1.3 Cálculo de parcialidades y saldos (`NumParcialidad`, `ImpSaldoAnt`, `ImpPagado`, `ImpSaldoInsoluto`) a partir de los cobros timbrados previos, con los impuestos del documento relacionado proporcionales al pago. Está en `features/payments/utils/payment-amounts.ts`: `readInvoiceTaxLines` (impuestos de los conceptos del XML timbrado), `invoiceBalance`, `computePaymentDocument`, `computePaymentTaxes` y `computePaymentTotals`. Pasan los vectores del diseño (factura del 1.1, RESICO de 10,000 y ejemplo del SAT), dos parcialidades, sin retenciones, sin impuestos y los errores; además, 20 000 cobros aleatorios quedan dentro de la tolerancia del PAC.
- [x] 1.4 XML del REP: `buildPaymentXml` en `features/stamping/services/payment-xml-builder.service.ts`, con un constructor propio en vez de tocar el de facturas. Los auxiliares que comparten (`esc`, `formatCfdiDate`, `toNoCertificado` y `cleanCertificate`) pasaron a `features/stamping/utils/cfdi-xml.ts`.
- [x] 1.5 Cadena original del complemento en `features/stamping/services/xml-seal.service.ts` (`pagos20Parts`), en el orden de `Pagos20.xslt` (confirmado contra el archivo oficial). El sandbox de SW aceptó tres REP de la factura del 1.1: pago total y dos parcialidades (ver "Confirmado").
- [x] 1.6 Servicio y server action de "Registrar cobro": factura PPD, timbrada y con saldo. Reserva el timbre y lo devuelve si el PAC rechaza.
  - Código: `features/payments/services/payment.service.ts` (`registerPayment`, `retryPaymentStamp`, `getInvoicePayments`, `getPaidAmountsByInvoice`, `hasActivePayments`) y las acciones `register-payment.action.ts` y `retry-payment-stamp.action.ts`.
  - Se guarda el XML sellado antes de llamar a SW. Si SW no contesta, el cobro queda `en_timbrado` y "Reintentar" reenvía el mismo XML, sin gastar otro timbre. Mientras tanto, la factura no acepta otro cobro, para que `NumParcialidad` no salte números.
  - `sw-client.service.ts` recupera el timbre con el 307 y ahora muestra `message`, que trae el código y el motivo.
  - Probado contra la base y el sandbox: errores de validación sin escribir nada; rechazo del PAC, que borra el cobro y devuelve el timbre; respuesta perdida, `IN_PROGRESS`, `UNCONFIRMED_PENDING` y reintento hasta timbrar; montos iguales al vector del diseño. El XML va a R2; el PDF y el correo llegan con la 1.8.
- [x] 1.7 Interfaz:
  - "Registrar cobro" es la acción principal en el detalle de una factura PPD timbrada con saldo, y desaparece mientras otro cobro se timbra. Para que la barra quepa, "Cancelar factura" y "Copiar UUID" pasaron a un menú "Más acciones" (⋯). Debajo de 1280 px, la barra va bajo el título;
  - diálogo `features/payments/components/register-payment-dialog.tsx`: fecha (hoy por defecto, sin fechas futuras ni anteriores a la factura), forma de pago con buscador y sin 99 (03 por defecto), monto (el saldo por defecto, sin pasarse), número de operación opcional, parcialidad, saldo después del cobro y timbres. Si ya pasó el día 5 del mes siguiente al pago, avisa que el plazo venció;
  - el talón (`invoice-payments.tsx`, clase `.talon` en `globals.css`): al pie de la hoja, tras una línea perforada, una fila por cobro (parcialidad, fecha, forma, número de operación, folio P, UUID corto, monto, saldo, estatus, XML/PDF y "Reintentar" si quedó sin confirmar). Abajo, el saldo pendiente o el sello "Pagada";
  - en la lista, las PPD timbradas muestran "Por cobrar", "Saldo $X" o "Pagada" bajo el total;
  - revisado a 1280, 1024, 768 y 375 px, claro y oscuro, sin errores en consola ni scroll horizontal. El envío desde el diálogo se prueba en la 1.10.
- [x] 1.8 PDF del REP con el diseño Talonario y correo al cliente con XML y PDF.
  - PDF: `features/payments/components/payment-pdf-document.tsx` y `generatePaymentPdf` en `pdf-generator.service.ts`. Lee todo del XML timbrado con `features/payments/utils/payment-cfdi.ts` (`readPaymentCfdi`), así que la representación impresa coincide con el CFDI. Lleva el folio en tinta roja, el sello "TIMBRADO" junto a los totales y el timbre con QR, sellos y cadena del TFD, en una sola página. Los sellos se cortan a 124 caracteres para que no se doblen.
  - Correo: plantilla `payment-stamped.tsx` y `sendPaymentEmail`, con el mismo `OVERRIDE_TO` que el de facturas.
  - `stampPayment` genera el PDF, sube XML y PDF a R2 y manda el correo si el cliente tiene uno. Nada de eso deshace el timbre.
  - Verificado: el PDF del REP 1 generado desde la base (una página, montos iguales al XML) y el correo renderizado a HTML, sin enviarlo.
- [x] 1.9 Bloquear la cancelación de una factura con REP vigentes: el SAT exige cancelar antes sus CFDI relacionados (RMF 2026, regla 2.7.1.34). Cancelar un REP pasó al feature 2 (2.9).
  - `cancelInvoice` revisa `hasActivePayments` antes de llamar al PAC. Probado con `SW_URL` apuntando a un host inexistente, como red de seguridad: lo rechaza y la factura sigue timbrada.
  - `CancelInvoiceDialog` recibe `blockedReason` (texto en `CANCEL_BLOCKED_BY_PAYMENTS`, en `constants/cancellation-reasons.ts`). En el detalle y en el menú de la lista explica por qué no se puede y oculta "Confirmar cancelación".
- [x] 1.10 Verificación:
  - **En seco en el sandbox:** pago total y dos parcialidades con retenciones (ver "Confirmado").
  - **En la app**, con permiso del usuario para los datos de prueba:
    - factura PPD A-1 (10,000 + IVA con retenciones RESICO, total 10,408.33), timbrada con el servicio;
    - REP P-1 de 5,000.00 por el servicio, pasando por la respuesta perdida y el reintento;
    - REP P-2 de 5,408.33 desde el diálogo (forma 02, "CHEQUE 0042"), con PDF y XML en R2 y correo enviado. El usuario confirmó el 2026-10-19 que el correo le llegó y se ve bien.
  - **Resultados:**
    - las dos parcialidades suman exacto los impuestos de la factura (bases 10,000.00, IVA 1,600.00, ISR 125.00 e IVA retenido 1,066.67);
    - la base, el XML, el PDF, el talón y la lista ("Pagada") coinciden;
    - la cancelación queda bloqueada en el detalle y en la lista;
    - sin errores en consola.

**Notas técnicas (Pagos 2.0)**

- Comprobante: `TipoDeComprobante="P"`, `SubTotal="0"`, `Total="0"`, `Moneda="XXX"`, `Exportacion="01"`; sin `FormaPago`, `MetodoPago` ni nodo `Impuestos`.
- Receptor: el de la factura, con `UsoCFDI="CP01"`.
- Un concepto: `ClaveProdServ="84111506"`, `Cantidad="1"`, `ClaveUnidad="ACT"`, `Descripcion="Pago"`, `ValorUnitario="0"`, `Importe="0"`, `ObjetoImp="01"`.
- Complemento `pago20:Pagos Version="2.0"`, namespace `http://www.sat.gob.mx/Pagos20`, esquema `http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd`.
- `pago20:Totales`: `MontoTotalPagos` y, si aplican, `TotalRetencionesISR`, `TotalRetencionesIVA`, `TotalTrasladosBaseIVA16` y `TotalTrasladosImpuestoIVA16`, en pesos.
- `pago20:Pago`: `FechaPago`, `FormaDePagoP`, `MonedaP`, `TipoCambioP="1"` en pesos y `Monto`. Su `ImpuestosP` suma los impuestos de sus documentos.
- `pago20:DoctoRelacionado`:
  - `IdDocumento` (UUID), `Serie` y `Folio`;
  - `MonedaDR`, y `EquivalenciaDR="1"` si es la misma moneda del pago;
  - `NumParcialidad`, `ImpSaldoAnt`, `ImpPagado` e `ImpSaldoInsoluto`;
  - `ObjetoImpDR="02"` e `ImpuestosDR` (retenciones y traslados).
- Plazo: a más tardar el día 5 del mes siguiente al cobro (RMF 2026, regla 2.7.1.32).
- Un mismo cobro puede saldar varias facturas del mismo cliente (varios `DoctoRelacionado`). Queda para después de la primera versión.

**Confirmado**

- **2026-10-16, prueba 1.1 en el sandbox de SW** (script en seco, sin escribir en la base). Aceptó:
  - emisor `FUNK671228PH6` "KARLA FUENTE NOLASCO" (CSD de pruebas del SAT, certificado `30001000000500003446`) con `RegimenFiscal="626"`;
  - receptor `EKU9003173C9` "ESCUELA KEMPER URGATE", CP 42501, régimen 601, `UsoCFDI="G03"`;
  - `MetodoPago="PPD"`, `FormaPago="99"`, dos conceptos con ISR 0.012500 e IVA 0.106667 retenidos;
  - una descripción con `&`, comillas y `<>`.

  UUID `e50d5d26-9896-4e50-9051-b0f841c9d089`: subtotal 10,999.99; IVA 1,760.00; retenido 1,310.84 (ISR 137.50 + IVA 1,173.34); total 11,449.15. Los totales del XML timbrado son los de `computeCfdiAmounts`, y el sello válido confirma que la cadena original decodifica bien las entidades. Sirve como documento relacionado para las pruebas en seco del REP.
- **Datos de prueba (cuenta `user_3BUkqSewENcLWEd8FqhKVDG2nTP`), cambiados con permiso el 2026-10-19:**
  - el perfil `FUNK671228PH6` (KARLA, `3c2b1996-…`) pasó de régimen 601 a 626; con 601, el sandbox lo rechazaba con `CFDI40141`;
  - cliente persona moral `EKU9003173C9` / ESCUELA KEMPER URGATE / 42501 / 601 (`bfec0fd0-90c9-43e6-832a-a75c69b5426d`), con correo `delivered@resend.dev`. Por el `OVERRIDE_TO` de `email.service.ts`, sus correos llegan al buzón del usuario;
  - factura PPD A-1 (`0f336dd2-b1f1-4cc3-9e0d-3371d026c301`, UUID `ec3aac4b-…`), pagada con los REP P-1 (`d5a2e70f-…`) y P-2 (`5e90efd9-…`). P-1 se timbró antes de la 1.8 y no tiene PDF;
  - **la cuenta quedó con 0 timbres.** Para más pruebas en la app hay que pedir permiso para sumar timbres de prueba.
- **Orden de la cadena original del complemento** (`Pagos20.xslt` oficial, revisado el 2026-10-16):
  1. `Pagos`: `Version`.
  2. `Totales`: `TotalRetencionesIVA`, `TotalRetencionesISR`, `TotalRetencionesIEPS`, `TotalTrasladosBaseIVA16`, `TotalTrasladosImpuestoIVA16`, `TotalTrasladosBaseIVA8`, `TotalTrasladosImpuestoIVA8`, `TotalTrasladosBaseIVA0`, `TotalTrasladosImpuestoIVA0`, `TotalTrasladosBaseIVAExento`, `MontoTotalPagos`.
  3. Por cada `Pago`: `FechaPago`, `FormaDePagoP`, `MonedaP`, `TipoCambioP`, `Monto`, `NumOperacion`, `RfcEmisorCtaOrd`, `NomBancoOrdExt`, `CtaOrdenante`, `RfcEmisorCtaBen`, `CtaBeneficiario`, `TipoCadPago`, `CertPago`, `CadPago`, `SelloPago`.
  4. Después, por cada `DoctoRelacionado`:
     - `IdDocumento`, `Serie`, `Folio`, `MonedaDR`, `EquivalenciaDR`, `NumParcialidad`, `ImpSaldoAnt`, `ImpPagado`, `ImpSaldoInsoluto`, `ObjetoImpDR`;
     - cada `RetencionDR` (`BaseDR`, `ImpuestoDR`, `TipoFactorDR`, `TasaOCuotaDR`, `ImporteDR`);
     - cada `TrasladoDR` (los mismos atributos).
  5. Al final, `ImpuestosP`: cada `RetencionP` (`ImpuestoP`, `ImporteP`) y luego cada `TrasladoP` (`BaseP`, `ImpuestoP`, `TipoFactorP`, `TasaOCuotaP`, `ImporteP`).

  Los atributos opcionales que no vienen no se escriben.
- **`Pagos20.xsd` oficial:**
  - en el XML, `RetencionesDR` va antes de `TrasladosDR`, y `RetencionesP` antes de `TrasladosP`;
  - `TipoCambioP` y `EquivalenciaDR` son opcionales en el esquema (las reglas de cuándo van están en la guía);
  - `BaseDR` debe ser mayor que 0 y lleva hasta 6 decimales;
  - `ImporteDR`, `ImpSaldoAnt`, `ImpPagado`, `ImpSaldoInsoluto` y `Monto` son `t_Importe`, y los `Totales` son `t_ImporteMXN`;
  - `NumParcialidad` va de 1 a 999; `Serie` lleva hasta 25 caracteres y `Folio` hasta 40.
- **Reglas de la guía, el estándar, la matriz de errores y la RMF 2026** (agente de investigación, 2026-10-16). El detalle y las fuentes están en el diseño, secciones "Cálculo", "Cancelación" y "Fuentes". Lo esencial:
  - `TipoCambioP="1"` y `EquivalenciaDR="1"` en pesos;
  - con una sola moneda, la suma de `ImpPagado` no puede pasar de `Monto`, sin tolerancia;
  - `ImporteDR` se valida contra `BaseDR × tasa` con una tolerancia que depende de los decimales;
  - el PAC no valida que `IdDocumento` exista ni la fecha de pago;
  - cancelar un REP requiere la aceptación del cliente, salvo al día hábil siguiente (reglas 2.7.1.34 y 2.7.1.35).

- **2026-10-19, REP en el sandbox de SW** (script en seco, sin escribir en la base), contra la factura `e50d5d26-…` del 1.1. Aceptó los tres:
  - pago total de 11,449.15, forma 03, con `NumOperacion`: UUID `36498ffb-378e-4e55-9782-d7822f7bc8c5`;
  - parcialidad 1 de 5,000.00 pagada el día 1 del mes, con `BaseDR` 4,803.85, IVA 768.62, ISR 60.05 e IVA retenido 512.41: UUID `0f01dd1c-4256-42e6-9629-0f68dcca4969`;
  - parcialidad 2 de 6,449.15, forma 02, con saldo final 0.00: UUID `5b6d8722-8c22-415e-8554-9f6f611fc953`.
- **Reenviar el mismo XML sellado no duplica el REP.** SW responde `307. El comprobante contiene un timbre previo.` (HTTP 400) y manda en `messageDetail` el CFDI ya timbrado, con su `TimbreFiscalDigital`. Por eso basta guardar el XML sellado antes de llamar a SW para que un reintento recupere el timbre. Hoy `sw-client.service.ts` mostraría ese XML completo como mensaje de error.

**Decisiones**

- **Reintento seguro (punto 6 del diseño).** Se guarda el XML sellado antes de llamar a SW. Si no hay respuesta, el cobro queda `en_timbrado` ("Sin confirmar" en el talón) y "Reintentar" reenvía el mismo XML: SW timbra o devuelve el timbre previo con el 307. Si SW rechaza, el cobro se borra y el timbre se devuelve.
- **El PDF del REP se arma desde su XML timbrado** (`readPaymentCfdi`), no desde las tablas.
- **Cabecera del detalle.** "Cancelar factura" y "Copiar UUID" pasaron a un menú "Más acciones" (⋯) para todas las facturas timbradas, y la barra va bajo el título debajo de 1280 px.
- **Dónde vive el CFDI de pago (aprobado el 2026-10-19).** Tablas propias: `payments` (el nodo `Pago` y su CFDI tipo P) y `payment_documents` (cada `DoctoRelacionado`), en lugar de filas de `invoices` con `cfdiType`. Así no hay que filtrar por tipo en la lista, el Inicio y los totales, ni volver opcionales `paymentForm` y `paymentMethod`.
- **Fecha de pago.** Se guarda como día (`paid_on`, tipo `date`). La hora se pone al armar el XML: 12:00:00, o la hora de emisión si el cobro es de hoy y aún no dan las 12, para que `FechaPago` no quede después de la `Fecha` del REP.
- **`payments` guarda `qr_code`**, igual que `invoices`, para el PDF del REP.
- **Sin relación inversa en `invoicesRelations`.** Evita la importación circular entre esquemas; los cobros de una factura se leen con consultas propias del servicio de cobros.

### 2. Corregir factura y estatus de cancelación

- **Esfuerzo:** medio-bajo.
- **Depende de:** nada.
- **Por qué:**
  - hoy corregir una factura timbrada es cancelarla a mano con motivo 01 y escribir el UUID que la sustituye; Factura.com lo hace en un paso;
  - `cancelInvoice` (`features/invoicing/services/invoice.service.ts`) marca `cancelada` en cuanto SW acepta la solicitud, aunque el SAT puede dejarla en proceso hasta que el cliente acepte o rechace.
- **Resultado:** "Corregir factura" abre el formulario prellenado. Al timbrar la nueva, relacionada con la original, se cancela la original con motivo 01. El detalle muestra el estatus real de la cancelación según el SAT.
- **Diseño:** `docs/plans/2026-10-19-corregir-factura-y-cancelacion-design.md`. El usuario lo aprobó el 2026-10-19. Propone hacer las subtareas en este orden: 2.1, 2.2, 2.4, 2.5, 2.3, 2.6, 2.7, 2.8 y 2.9.

**Subtareas**

- [x] 2.1 Esquema. Se usaron columnas, no una tabla `invoice_relations` ni valores nuevos en `invoice_status`:
  - en `invoices`: `relation_type`, `related_uuid`, `cancellation_status` (enum `cancellation_status`: `en_proceso` o `rechazada`), `cancellation_requested_at`, `cancellation_substitute_uuid`, `sat_cancellable`, `sat_cancellation_status` y `sat_checked_at`, con índice en `related_uuid`;
  - en `payments`: las mismas, salvo `relation_type`, con índice en `related_uuid`. Sirve para saber qué REP ya tiene sustituto;
  - la interfaz `Invoice` (`invoice.types.ts`) tiene los campos nuevos;
  - la migración `0011_cancellation_status.sql` es aditiva (18 sentencias). Se aplicó a mano en la base Neon de pruebas el 2026-10-19, en una transacción y con permiso. Las 29 facturas y los 2 cobros siguen igual.
- [ ] 2.2 XML: `cfdi:CfdiRelacionados`, que va después de `InformacionGlobal` y antes de `cfdi:Emisor`, y su lugar en la cadena original de `xml-seal.service.ts`.
  - **Hecho el código:**
    - `cfdiRelacionadosXml` y `RELATION_SUBSTITUTION` en `features/stamping/utils/cfdi-xml.ts`;
    - `buildCfdiXml` escribe el nodo si la factura trae `relationType` y `relatedUuid`;
    - `buildPaymentXml` lo escribe si el pago trae `relatedUuid`;
    - `buildCadenaOriginal` agrega `TipoRelacion` y cada `UUID` después de `LugarExpedicion` y antes del RFC del emisor. La cadena de prueba quedó en ese orden.
  - **Falta que SW lo acepte en el sandbox.** El 2026-10-19 la cuenta de pruebas de SW ya no tenía timbres: respondió `S2000 - El saldo del cliente se ha agotado`, y el saldo marca 30 asignados y 30 usados. El script en seco es `scratchpad/canc/dry-run-relation.ts`.
- [ ] 2.3 Flujo "Corregir factura" (reutiliza `duplicateInvoice`): al timbrar la sustituta con `TipoRelacion="04"`, cancelar la original con motivo 01 y `FolioSustitucion` igual al UUID nuevo. Si la cancelación falla, la nueva queda timbrada y se le dice al usuario qué hacer.
  - **Hecho el código:**
    - `createCorrectionDraft` (`copyInvoiceInput`, compartido con `duplicateInvoice`) reutiliza el borrador que ya corrige la factura;
    - `correctionBlockReason` (`utils/correction.ts`) explica por qué no se puede corregir: REP vigentes, cancelación en proceso, ya sustituida o plazo vencido;
    - `stampInvoice` revisa la original antes de timbrar (`prepareReplacement`): bloquea si cambió el RFC o si hay una cancelación en proceso;
    - al timbrar, `stampInvoice` guarda `cancellationSubstituteUuid` en la original y pide su cancelación con 01 (`cancelReplacedInvoice`). Devuelve `replacement` para el aviso;
    - `getInvoiceRelations` da las ligas "Sustituye a" y "Sustituida por" y el borrador pendiente;
    - la acción es `correct-invoice`.
  - **Verificado sin timbrar** (`scratchpad/canc/test-correction-draft.ts` y capturas):
    - bloqueos de la `123123-0` (en proceso), la A-1 (con REP) y la AB-1 (cancelada);
    - borrador de la We-0 con la relación, reutilizado en el segundo intento;
    - desde la interfaz quedó el borrador **We-1** (`195080f9-…`), que corrige la We-0. Se deja para la prueba de la 2.8.
  - **Falta timbrar la corrección en el sandbox** (2.8): la cuenta de SW no tiene timbres.
- [x] 2.4 Servicio que consulta el `ConsultaCFDIService` del SAT: `Estado`, `EsCancelable` y `EstatusCancelacion`. Guardar el resultado y la fecha de la consulta (eso se hace en la 2.5).
  - **Código** (`features/stamping/services/sat-status.service.ts`):
    - `getSatCfdiStatus`: SOAP con `fetch`, CDATA y 10 s de tiempo máximo;
    - `parseSatStatusResponse`: tolera `i:nil`, la falta del punto final y "No encontrado" en minúsculas;
    - `statusQueryFromCfdi`: RFC, `Total`, UUID y `fe`, leídos del XML timbrado;
    - `formatExpressionTotal` y `buildStatusExpression`;
    - `satStatusUrl`: `SAT_STATUS_URL`; si no existe, la copia de SW cuando `SW_URL` es el sandbox, y si no, el SAT.
  - **Verificado** (`scratchpad/canc/test-sat-status.ts`): 16 casos (formato de `tt`, `&` en el RFC, respuestas grabadas), más dos consultas reales a la factura `e50d5d26-…`:
    - la copia de SW la da "Vigente";
    - el SAT de producción responde 602.
  - **Consulta de las 26 facturas y REP de la base** con la copia de SW:
    - las 5 que la app marcó canceladas salen "Cancelado";
    - las de hasta $1,000 y los REP de hoy salen "Cancelable sin aceptación";
    - las demás salen "Cancelable con aceptación".

    Ojo: la copia de SW da "Cancelable con aceptación" a la A-1, aunque tiene REP vigentes; no simula el "No cancelable" por CFDI relacionados.
- [x] 2.5 `cancelInvoice`: después de SW, consultar al SAT y, si queda en proceso, no marcar `cancelada`. Agregar el botón "Actualizar estatus" y consultar al abrir el detalle mientras siga en proceso.
  - **Servicio hecho** en `features/invoicing/services/cancellation.service.ts`; `invoice.service.ts` ya no cancela.
    - `cancelInvoice` valida antes de llamar a SW: la factura no puede tener una solicitud en proceso ni REP vigentes, y debe estar dentro del plazo del CFF 29-A. Con el motivo 01, usa la sustituta guardada si no recibe un UUID.
    - Después de SW, guarda `en_proceso` con la fecha, el motivo y el acuse, y consulta al SAT una vez.
    - Funciones nuevas: `refreshCancellationStatus`, `refreshPendingCancellations` (hasta 10, cada 10 minutos) y `getCancellationPreview` (`EsCancelable`, plazo y si ya está cancelada).
    - La decisión y el plazo son funciones puras en `features/stamping/utils/cancellation.ts` (`decideCancellation` y `cancellationDeadline`). Un rechazo que se ve en los primeros 5 minutos después de una solicitud nueva se ignora.
  - `sw-client.service.ts` lee el código de `data.uuid`: 201 y 202 cuentan como solicitud recibida; los demás son error, explicados en palabras llanas.
  - Acciones: `cancel-invoice` (devuelve `outcome` y `cancellable`), `refresh-cancellation-status`, `refresh-pending-cancellations` y `get-cancellation-preview`.
  - `todayInMexico` pasó a `features/stamping/utils/cfdi-xml.ts`.
  - **Verificado:**
    - 16 casos de la decisión y el plazo (`scratchpad/canc/test-decide.ts`);
    - 7 respuestas de SW con un `fetch` simulado, entre ellas un 205 dentro de un `success` (`test-sw-cancel-codes.ts`);
    - en el sandbox, con permiso, la factura vieja `123123-0` (`5f2a89ab-…`, emisor persona moral, plazo hasta el 31 de marzo de 2027) se canceló con el motivo 02. SW respondió 201, la copia del SAT dijo "Cancelable con aceptación" y "En proceso", y la factura quedó `timbrada` con `en_proceso`, el acuse en R2 y la consulta guardada. Una segunda solicitud se bloquea.
  - **Interfaz:** "Actualizar estatus" está en el aviso y en el menú ⋯. El hook `useCancellationRefresh` consulta al SAT al abrir el detalle (si la última consulta tiene más de un minuto) y al abrir la lista (`refresh-pending-cancellations`). En la prueba, la consulta se actualizó sola al abrir la `123123-0`.
- [x] 2.6 Interfaz: antes de cancelar, decir si el cliente tendrá que aceptar. Sellos "Cancelación en proceso" y "Rechazada por el cliente" en `status-badge.tsx` y en la hoja.
  - `StatusBadge` recibe la factura y usa `invoiceStampState` (`utils/cancellation-state.ts`): "Por cancelar", "En cancelación" (punteado) y "Cancelación rechazada", en ocre. La columna de estatus de la lista y del Inicio pasó a 136 px.
  - **Diálogo de cancelar**, reescrito:
    - motivos en palabras llanas, con la clave en mono;
    - "Consultando al SAT…" y lo que dice `EsCancelable` (`sat-preview-line.tsx`);
    - con una sustituta, el motivo 01 y el UUID ya puestos, y "No cancelable" no bloquea;
    - plazo vencido;
    - el texto "Cancelar no gasta timbres".
  - **Diálogo "Corregir factura"** (`correct-invoice-dialog.tsx`): lo que dice el SAT, el camino del motivo 02 para el RFC equivocado y lo que cuesta en timbres.
  - **Avisos entre el título y la hoja** (`cancellation-notice.tsx`):
    - en proceso, con "Actualizar estatus";
    - "Falta cancelarla", con "Pedir cancelación";
    - rechazada, con "Volver a pedirla";
    - un borrador que corrige la factura;
    - el borrador de corrección: el aviso de que cambió el RFC o de que hay una cancelación en proceso, con el botón Timbrar deshabilitado.
  - **Hoja:** segundo sello ocre "En cancelación" junto al azul; el sello rojo dice cómo se canceló; "Sustituye a" y "Sustituida por" con liga en el encabezado.
  - **Formulario:** aviso de corrección y advertencia si cambia el RFC. El diálogo de timbrar tiene el renglón "Sustituye a".
  - **Menús ⋯ del detalle y de la lista:** "Corregir factura", y "Pedir cancelación" o "Volver a pedir la cancelación" según el estado.
  - **Otros:** la ayuda explica corregir y cancelar; el PDF de la factura muestra el CFDI relacionado (revisado en el PDF del borrador We-1).
  - **Verificado:** 375, 768, 1024 y 1280 px, en claro y oscuro, sin errores en consola ni scroll horizontal (`scratchpad/canc-ui.cjs` y `canc-ui2.cjs`; capturas en `shots/canc/`).
- [x] 2.7 Confirmar con SW si cancelar consume timbre y decirlo en el diálogo. **Confirmado el 2026-10-19: no consume.** La cuenta de pruebas tenía 0 timbres y SW aceptó la cancelación de la `123123-0`; `stampsUsed` siguió en 30 (`GET /management/v2/api/users/balance`). El diálogo de cancelar y el de corregir lo dicen.
- [ ] 2.8 Verificación en sandbox de la sustitución completa. El servicio del SAT en producción no conoce los UUID del sandbox (responde 602), pero la copia de pruebas de SW sí (ver "Confirmado").
- [ ] 2.9 Cancelar y sustituir un REP (viene del feature 1):
  - solo el último de cada factura;
  - su monto vuelve al saldo cuando el SAT confirma la cancelación;
  - la sustitución repite la parcialidad, la fecha de pago y los saldos.

  Ver el diseño del complemento de pago, sección "Cancelación".
  - **Servicio** (`features/payments/services/payment-cancellation.service.ts`):
    - `cancelPayment`: con 02 o 03, solo el último cobro; con 01, el que una corrección sustituyó. Revisa el plazo y el código de SW, deja `en_proceso` con acuse y consulta al SAT. Cuando el SAT lo cancela, el pago pasa a `cancelado` y su monto vuelve al saldo;
    - `refreshPaymentCancellations`, `getPaymentCancellationPreview` y `getLastCountingPayment`.
  - **Corrección** (`correctPayment` en `payment.service.ts`):
    - `registerPayment` y la corrección comparten `reserveAndStamp`, que deja fuera el cobro sustituido. Así el nuevo toma su parcialidad y su saldo anterior, y lleva `relatedUuid`;
    - `stampPayment` escribe `CfdiRelacionados`;
    - después de timbrar, se pide la cancelación del anterior con 01. Si falla, queda "Por cancelar".
  - **Saldo:** `countingPayments` (`payment-amounts.ts`) deja fuera los cobros cancelados y los sustituidos. Lo usan `summarizeBalance`, la reserva y `getPaidAmountsByInvoice` (con `not exists`). Mientras un cobro que cuenta está en cancelación, no se registra otro (`CANCELLATION_PENDING`).
  - **Interfaz:**
    - talón: el último cobro tiene el menú ⋯ con "Corregir cobro" y "Cancelar cobro";
    - estados: "En cancelación" (con "Actualizar"), "Por cancelar" o "Cancelación rechazada" (con "Pedir cancelación" o "Volver a pedirla"), "Cancelado" y "sustituido por P-3" (monto tachado);
    - aviso cuando hay una cancelación de cobro en proceso; el talón consulta al SAT al abrir la factura;
    - `cancel-payment-dialog.tsx`;
    - `register-payment-dialog.tsx` en modo corrección (`correcting`), con el renglón "Sustituye a" y abierto desde el talón;
    - el PDF del REP muestra el CFDI relacionado (`readPaymentCfdi` lee `related`).
  - **Verificado:**
    - reglas sin escribir (`scratchpad/canc/test-payment-rules.ts`, 6 casos);
    - en el sandbox, con permiso, se canceló el **P-2 de la A-1** desde el talón con el motivo 02. SW respondió 201 y quedó `en_proceso`; el talón muestra el estado y oculta "Registrar cobro";
    - capturas a 1280 y 375 px, en claro y oscuro, sin errores.
  - **Falta:** probar "Corregir cobro" timbrando; necesita timbres de SW.

**Notas técnicas**

- Motivo 01 exige que la sustituta ya esté timbrada con `TipoRelacion="04"` hacia la original: primero se timbra y luego se cancela.
- Servicio: `https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc`, operación SOAP `Consulta`. Su `expresionImpresa` es `?re=<RFC emisor>&rr=<RFC receptor>&tt=<total>&id=<UUID>&fe=<últimos 8 del sello>`.
- Valores posibles:
  - `EsCancelable`: "No cancelable", "Cancelable sin aceptación" o "Cancelable con aceptación".
  - `EstatusCancelacion`: "En proceso", "Plazo vencido", "Cancelado con aceptación", "Cancelado sin aceptación" o "Solicitud rechazada".
- Confirmado (RMF 2026, regla 2.7.1.35): un REP siempre necesita la aceptación del cliente, salvo si se cancela a más tardar el día hábil siguiente a su emisión (fracción IX).
- Usar el `EsCancelable` del SAT en lugar de calcular a mano las excepciones de la RMF.

**Confirmado** (2026-10-19, dos agentes de investigación; detalle y fuentes en el diseño)

- **Aceptación:**
  - el cliente tiene 3 días hábiles (preguntas frecuentes de cancelación 2026, preguntas 13 a 15);
  - el silencio solo cancela la primera solicitud. Si el cliente ya rechazó una, la siguiente sin respuesta queda "Plazo vencido" y la factura sigue vigente;
  - por eso la transición se decide con `Estado`, no solo con `EstatusCancelacion`.
- **Sustitución:**
  - al timbrar la sustituta, la original aparece "No cancelable". Es normal: el vínculo se rompe al pedir la cancelación con 01;
  - si el RFC del cliente estaba mal, el SAT pide cancelar primero con 02 y después emitir la correcta con la relación 04 (pregunta 9).
- **Plazo para cancelar:** el mes de la declaración anual del ejercicio en que se emitió la factura (CFF, art. 29-A). Es abril del año siguiente para personas físicas y marzo para morales.
- **`tt` y la expresión:**
  - `tt` lleva el total sin ceros de más: `11449.15`, `1000.0`;
  - un `&` del RFC va como `&amp;`;
  - producción acepta la expresión `?re=…` con o sin `fe`.
- **Pruebas:**
  - el viejo servicio de pruebas del SAT ya no existe;
  - SW tiene una copia sin token en `https://api.test.sw.com.mx/ConsultaCFDIService.svc` que conoce las facturas del sandbox. La `e50d5d26-…` sale "Vigente" y "Cancelable con aceptación".
- **Respuesta de cancelación de SW:**
  - `data.uuid` trae un código por UUID;
  - 201 significa solicitud recibida, con o sin aceptación; no significa cancelada;
  - 205, 207, 208 y 212 pueden llegar dentro de un `status: success`;
  - **hallazgo:** hoy `cancelInvoice` los trataría como éxito. Se corrige en 2.5.
- **La copia del SAT de SW es inconsistente con los REP:** antes de cancelar el P-2 respondió "Cancelable sin aceptación", y justo después "Cancelable con aceptación" y "En proceso". En producción se espera "sin aceptación" el día hábil siguiente a la emisión (fracción IX). La app no depende de eso: muestra lo que el SAT diga después.
- **Datos de prueba que deja la feature 2** (sandbox, con permiso):
  - la `123123-0` (`5f2a89ab-…`) y el P-2 de la A-1 tienen la cancelación en proceso con el motivo 02;
  - el borrador **We-1** (`195080f9-…`) corrige la We-0 y está listo para timbrarse en la prueba de la 2.8.

  "Actualizar estatus" dirá si la copia de SW los resuelve.
- **Recién timbrado:** el SAT puede tardar en tener un CFDI recién timbrado (SW habla de hasta 48 h). Cancelar justo después puede fallar con 205. Por eso, si la cancelación de la original falla, queda "Por cancelar" con un botón para pedirla otra vez.

### 3. Catálogo de servicios

- **Esfuerzo:** bajo.
- **Depende de:** nada.
- **Por qué:** un freelancer factura casi siempre los mismos 2 a 5 servicios, y hoy los vuelve a escribir con su clave SAT cada vez.
- **Resultado:** página "Mis servicios" en la navegación. En el formulario, cada concepto se puede llenar desde el catálogo (descripción, ClaveProdServ, ClaveUnidad y precio) y guardar en él.

**Subtareas**

- [x] 3.1 Tabla `catalog_items` (userId, descripción, `productServiceCode`, `unit`, precio sin IVA, borrado lógico y fechas) y su migración.
  - Esquema en `database/schemas/catalog.schema.ts`, con índice por `user_id`.
  - `unit_price` acepta nulos: el servicio puede no tener precio fijo, y el precio se escribe en cada factura.
  - La migración `0012_catalog_items.sql` solo crea la tabla. Se aplicó a mano en la base Neon de pruebas el 2026-10-19, en una transacción y con permiso.
- [x] 3.2 Módulo `features/catalog/` (components, actions, services, types y schemas) con CRUD filtrado por `userId`.
  - **Servicio** (`catalog.service.ts`):
    - `getCatalogItems` (en orden alfabético), `create`, `update` y `delete` (borrado lógico);
    - `saveConceptToCatalog`: si ya existe un servicio con la misma descripción (sin importar mayúsculas), lo actualiza; si no, lo crea.
  - **Acciones:** `create-`, `update-` y `delete-catalog-item`, y `save-concept-to-catalog`. Validan con `catalog-item.schema.ts`.
  - **Precios** (`utils/catalog-price.ts`): `priceForInvoice` y `priceForCatalog` convierten entre precio con y sin IVA, redondeado a 2 decimales.
  - **Verificado:** 14 casos contra la base (`scratchpad/catalog/test-catalog-service.ts`), entre ellos que otro usuario no puede editar; borra lo que crea.
- [x] 3.3 Ruta `/catalog`, entrada en `shared/components/nav-config.ts` y estado vacío propio.
  - Página "Mis servicios", con `loading` y `error`. "Mis servicios" aparece en la navegación después de Clientes.
  - **Lista** (`catalog-list.tsx`): búsqueda por descripción o clave; columnas desde 1024 px, con la clave y la unidad recortadas. Si no hay precio, dice "Varía".
  - **Diálogo** (`catalog-item-dialog.tsx` + `catalog-item-form.tsx`): claves con buscador y el precio sin IVA opcional.
  - **Borrar** (`delete-catalog-item-dialog.tsx`): pide confirmación.
  - **Estado vacío:** hoja en lápiz, con "Agregar mi primer servicio".
  - `toComboboxOptions` pasó a `shared/utils/catalog-options.ts` y lo usa también el formulario de factura.
- [x] 3.4 `invoice-form.tsx`: elegir del catálogo en cada concepto con `shared/ui/combobox.tsx`, y "Guardar en mis servicios". El precio se convierte según el interruptor de precios con o sin IVA.
  - **"De mis servicios"** (`catalog-picker.tsx`): un buscador junto a la etiqueta "Descripción" llena la descripción, la clave, la unidad y el precio. El precio va convertido si la factura incluye IVA; si el servicio no tiene precio, se respeta el que ya tenía el concepto.
    - Es un popover propio y no el `Combobox`, para que el disparador sea un enlace discreto.
  - **"Guardar en mis servicios":** un ícono junto al importe de cada concepto. Guarda el precio sin IVA y actualiza el buscador sin recargar la página.
    - Si aún no hay servicios, una línea bajo "Agregar concepto" explica el ícono.
  - Las páginas de nueva factura y de editar cargan los servicios.
- [x] 3.5 Verificación: crear, editar, borrar y usar en una factura, a 375 y 1280 px.
  - En el navegador (`scratchpad/catalog-ui.cjs`, `catalog-save.cjs` y `catalog-ui2.cjs`/`3`):
    - alta de dos servicios desde el estado vacío y el botón;
    - edición del precio (10,000 a 12,000) y borrado de uno;
    - uso en una factura nueva: 12,000 sin IVA, 13,920 con IVA;
    - "Guardar en mis servicios" con precio con IVA (1,160 se guarda como 1,000); al volver a guardarlo, avisa que lo actualizó.
  - Revisado a 375, 768, 1024 y 1280 px, en claro y oscuro, sin errores en consola ni scroll horizontal.
  - A 768 px las columnas se encimaban; ahora la lista se apila hasta 1024 px.
  - Quedan tres servicios de ejemplo en la cuenta de pruebas: "Diseño de identidad visual", "Hosting anual" y "Mantenimiento mensual del sitio".

## Fase 2 — Lo que nadie hace bien

### 4. Clientes del extranjero en dólares

- **Esfuerzo:** medio.
- **Depende de:** nada. Si 1 ya está hecho, el REP en dólares entra aquí.
- **Por qué:** muchos freelancers RESICO cobran a clientes de EE. UU. Solo Gigstack pone el tipo de cambio automático; los demás lo piden a mano.
- **Resultado:** un cliente "en el extranjero" con país y número de identificación fiscal. Su factura sale en USD, con el tipo de cambio puesto solo, IVA 0 % cuando aplica (explicado) y sin retenciones.
- **Diseño:** `docs/plans/2026-10-19-clientes-extranjero-design.md`. El usuario lo aprobó el 2026-10-20. Agrega la subtarea 4.9 y propone este orden: 4.2, 4.1, 4.4, 4.3, 4.6, 4.5, 4.7, 4.9 y 4.8.

**Subtareas**

- [x] 4.1 Clientes: `country` (c_Pais) y `foreignTaxId` (NumRegIdTrib). El interruptor "Cliente en el extranjero" pone RFC `XEXX010101000`, régimen 616 y el uso CFDI que diga la guía (confirmado: S01). Además:
  - el IVA que se le cobra se elige por cliente;
  - el código postal acepta nulos;
  - el aviso de RFC repetido no aplica a los RFC genéricos.
  - **Esquema** (`client-form.schema.ts`): `isForeign` decide qué se valida: país (distinto de MEX) e IVA, o bien RFC, CP y régimen. Un RFC `XEXX010101000` escrito en el modo de México pide cambiar de modo.
  - **Servicio** (`clientValues`): un cliente del extranjero se guarda con `XEXX010101000`, 616, S01 y sin CP. Además:
    - el número fiscal se guarda sin guiones y debe cumplir el patrón del país;
    - un RFC genérico no cuenta como repetido; para `XEXX`, se revisan el país y el número fiscal;
    - los mensajes de error ahora están en español.
  - **Acciones:** `create-client` y `update-client` reciben los datos tipados (antes era un `FormData`) y los validan con el esquema.
  - **Formulario:** el selector "En México / En el extranjero" junto a "Datos fiscales". En el extranjero aparecen el país (con buscador), el número fiscal (con la pista de su formato), el nombre y "¿Le cobras IVA?" con las condiciones del 0 %. Se ocultan la constancia y el uso CFDI.
  - **Lista:** "En el extranjero · Estados Unidos" y el número fiscal en lugar del RFC.
  - **XML:** `receptorXml` (`features/stamping/utils/cfdi-xml.ts`) lo comparten la factura y el REP: para `XEXX`, el CP del emisor, `ResidenciaFiscal`, `NumRegIdTrib` y 616.
  - **Verificado en el navegador** (`scratchpad/foreign-client-ui.cjs`):
    - rechaza "12345" para EE. UU. y pide elegir el IVA;
    - guarda "12-3456789" como 123456789 y rechaza el repetido;
    - edita el IVA a 16 %;
    - sin errores y sin scroll a 375 px.
  - Quedó el cliente de prueba "Acme Inc." (EE. UU.).
- [x] 4.2 Catálogos `c_Pais` y `c_Moneda` (al menos MXN, USD y EUR) en la base, con seed.
  - **Datos:** `database/seeds/data/c_pais.json` (250 países) y `c_moneda.json` (183 monedas), generados del `catCFDI_V_4_20261015.xls` oficial con `database/seeds/scripts/sat-catalog-to-json.py` (python3 + xlrd).
  - **Seed y servicio:** el seed los carga; `getCountryOptions` (sin MEX) y `getCountryLabels` están en `sat-catalog.service.ts`. `countryName` quita el artículo: "Estados Unidos (los)" queda como "Estados Unidos".
  - **Migración `0013_foreign_clients.sql`:**
    - tablas `countries`, `currencies` y `exchange_rates`;
    - en `clients`: `country`, `foreign_tax_id` e `iva_rate`, y `postal_code` deja de ser obligatorio;
    - en `invoices`: `exchange_rate`, `exchange_rate_source` e `iva_rate` (0.16 por defecto);
    - en `payments`: `exchange_rate`.

    Se aplicó en Neon de pruebas el 2026-10-20, con los catálogos, en una transacción y con permiso. Las 30 facturas quedaron con IVA 0.16.
- [x] 4.3 Facturas: selector de moneda (pesos o dólares) y `exchangeRate` con su origen (`exchangeRateSource`: `dof` o `manual`).
  - **Formulario:** en dólares pide el tipo de cambio. Lo consulta solo con `getDofRateAction`, y si Banxico no responde pide escribirlo. El total muestra "Son $X MXN al tipo de cambio".
  - **Al timbrar:** si el origen no es `manual`, `stampInvoice` usa el del DOF del día del timbrado y lo guarda. Si no lo consigue, no timbra.
  - **Cliente del extranjero:** al elegirlo, la factura pasa a dólares con S01 y sin retenciones.
  - **Lista, detalle, Inicio y PDF:** cada importe va en su moneda (`formatCurrency(monto, moneda)`). El importe con letra dice "DÓLARES … USD".
  - **Verificado:**
    - el borrador `Nº0002` (USD 2,500.00 a Acme Inc.) se capturó en el navegador;
    - formulario, detalle, diálogo de timbrado y PDF revisados a 375 y 1280 px.
- [ ] 4.4 Tipo de cambio desde la API SIE de Banxico (variable `BANXICO_TOKEN`, opcional), con caché por fecha y editable.
  - **Código:** `features/exchange-rates/`. `getDofRate(moneda, día)` revisa primero la caché (`exchange_rates`). Si no está, consulta la serie SF60653 del día D-7 al D+2 y guarda el resultado; sin token devuelve null.
  - **Probado:** con respuestas simuladas de Banxico (`scratchpad/foreign/test-banxico.ts`).
  - **Falta:** probarlo con el token real. Mientras tanto, el tipo de cambio se escribe a mano (decisión del usuario del 2026-10-20).
- [x] 4.5 XML:
  - `TipoCambio` con hasta 6 decimales (`formatExchangeRate`);
  - en el receptor, `ResidenciaFiscal` y `NumRegIdTrib` (`receptorXml`);
  - `DomicilioFiscalReceptor` igual al `LugarExpedicion`;
  - IVA a tasa 0 % (`TasaOCuota="0.000000"`, `Importe="0.00"`);
  - `Exportacion="01"`.

  Se verificó en seco con `scratchpad/foreign/dry-xml-usd.ts`. Falta que el PAC lo acepte (4.8).
- [x] 4.6 IVA 0 %: el usuario lo elige por cliente y la factura lo hereda (`invoices.iva_rate`), con la explicación del art. 29 de la LIVA; si no aplica, es 16 %.
  - Para un cliente del extranjero, `prepareInput` quita las retenciones y fuerza S01. A un cliente de México siempre le pone 16 %.
- [x] 4.7 El Inicio suma en pesos: cada factura multiplica por `coalesce(exchange_rate, 1)` en `dashboard.service.ts`.
  - El Inicio carga sin errores. La conversión con una factura timbrada en dólares se revisa en la 4.8.
  - **Para "Tu mes" (7):** sumar con la misma conversión.
- [ ] 4.8 Verificación en sandbox: factura en USD a `XEXX010101000` con IVA 0 %, y su complemento de pago en dólares. Necesita timbres de prueba en SW (el 2026-10-20 seguía en 0 de 30). Hay que comprobar que el PAC acepta `NumRegIdTrib` sin el Complemento de Comercio Exterior (riesgo CFDI40155).
- [x] 4.9 Complemento de pago en dólares (viene del feature 1):
  - `MonedaP="USD"`, `TipoCambioP` del día del pago y `EquivalenciaDR="1"`;
  - `Totales` en pesos con round(Σ × TC, 2), redondeando al final (`computePaymentTotals`);
  - el receptor del extranjero con CP01.
  - **Diálogo "Registrar cobro":** el tipo de cambio sigue la fecha del pago (el del DOF) hasta que el usuario escribe uno. Si el escrito es distinto, ofrece "Usar ese" con el del DOF. Muestra el cobro en pesos y no deja timbrar sin tipo de cambio.
  - **Corregir cobro:** conserva el tipo de cambio del cobro original.
  - **Talón y PDF:** el talón y el PDF muestran los importes en la moneda del pago y el tipo de cambio; los totales del PDF van "en pesos". El PDF también muestra la residencia fiscal y el número de registro.
  - **Verificado:**
    - 9 casos de importes y XML (`scratchpad/foreign/test-rep-usd.ts`), con el ejemplo de la guía (348,000.03);
    - el diálogo y el talón con A-1 forzada a dólares solo durante las capturas, sin timbrar, a 375, 768 y 1280 px en claro y oscuro;
    - el PDF, a partir de una copia del P-1 pasada a dólares en memoria.

    El timbrado real entra en la 4.8.

**Notas técnicas**

- Art. 20 del CFF: se usa el tipo de cambio publicado en el DOF el día anterior a la operación.
  - **Confirmado el 2026-10-19:** para un día D es la serie **SF60653** de Banxico ("para solventar obligaciones", por fecha de liquidación), no la `SF43718` (la FIX por fecha de determinación). Se comprobó en los 292 días de 2026; el 19 de octubre es 18.4250.
  - SF60653 trae valores dos días adelante, así que se consulta el rango D..D.
- **Confirmado el 2026-10-19** (guía rev. 3, matriz de marzo de 2026 y catálogo del 15 de octubre de 2026; detalle y fuentes en el diseño):
  - **Receptor:** `XEXX010101000`, 616 y S01, con `DomicilioFiscalReceptor` igual al `LugarExpedicion` (CFDI40149, 40159 y 40161).
  - **Residencia y número fiscal:** `ResidenciaFiscal` distinta de MEX. El `NumRegIdTrib` sigue el patrón de c_Pais: 9 dígitos en EE. UU. y Canadá; los demás países no tienen patrón.
  - **Exportación:** `Exportacion="01"` para servicios.
  - **IVA 0 %:**
    - fracción IV y último párrafo del art. 29 de la LIVA (servicios personales independientes aprovechados en su totalidad en el extranjero);
    - el pago va por transferencia o cheque desde una cuenta del extranjero (RLIVA arts. 58 y 61);
    - en el XML, `TasaOCuota="0.000000"` e `Importe="0.00"`.
  - **Retenciones:** el cliente del extranjero no retiene; lo impide la app.
  - **Moneda:** USD lleva 2 decimales; `TipoCambio` hasta 6. El rango de variación es 500 %, así que casi nunca pide confirmación.
  - **API SIE de Banxico:** token gratuito (formulario con captcha) en el encabezado `Bmx-Token`; los días sin dato vienen como `N/E`.

### 5. Cobranza

- **Esfuerzo:** medio-bajo.
- **Depende de:** 1 (tabla de cobros).
- **Por qué:** el freelancer no sabe quién le debe. Factura.com y Alegra mandan recordatorios.
- **Diseño:** `docs/plans/2026-10-20-cobranza-design.md`, aprobado el 2026-10-20 junto con la migración 0014, los datos de prueba y un correo de prueba.
- **Resultado:**
  - cada factura dice si está por cobrar, parcial, cobrada o vencida;
  - el Inicio muestra cuánto te deben;
  - los recordatorios salen por WhatsApp o correo con tus datos de pago.

**Subtareas**

- [x] 5.1 Vencimiento: `dueDate` en facturas, calculado con los días de crédito del cliente (`paymentTermsDays`).
  - **Cliente:** "Días de crédito" (0 a 365, opcional) en la sección "Facturación", también para clientes del extranjero.
  - **Factura:** el mismo campo en "Cómo te pagan", prellenado con el del cliente y con la pista "Vence el … si la timbras hoy".
    - Si es PUE y vencería después de fin de mes, avisa y ofrece "Cambiar a PPD".
    - La fecha de hoy llega como prop desde la página, por la regla de lint que no deja usar `new Date()` al renderizar.
  - **Al timbrar:** `due_date` es el día del timbrado más los días, y una PUE con días mayores que 0 nace por cobrar (`dueDateFor` y `startsAwaitingPayment` en `features/collections/utils/due-date.ts`).
  - **Copias:** "Duplicar" y "Corregir factura" copian los días.
  - **Falta:** verlo en un timbrado real, cuando SW tenga timbres.
- [x] 5.2 Estado de cobro derivado de los cobros (1).
  - **Función pura:** `collectionState` (`features/collections/utils/collection-state.ts`): por cobrar, parcial, cobrada o vencida.
    - Solo aplica a facturas vigentes: no a borradores, canceladas, en cancelación ni sustituidas.
    - Una PPD sale de sus complementos de pago.
    - Una PUE nace cobrada salvo que tenga días de crédito o se marque "por cobrar".
  - **PUE por cobrar:** vence a fin del mes de emisión (RMF 2.7.1.39).
    - Pasado ese día queda vencida y el talón ofrece "Sustituir por una factura PPD": el borrador de corrección del feature 2 con PPD, forma 99 y relación 04.
    - Esto cubre también el aviso que el plan dejaba para Tu mes (7).
  - **Detalle:**
    - una etiqueta de cobro junto a la de estatus;
    - "Recordar pago" en el encabezado;
    - "Marcar por cobrar" en el menú de una PUE cobrada;
    - el talón PPD muestra el vencimiento;
    - una PUE por cobrar tiene su propio talón, con "Ya me pagaron".
  - **Encabezado:** ahora los botones bajan completos a otra línea cuando no caben junto al título.
- [x] 5.3 Inicio: "Te deben", con el total y las vencidas. En la lista, filtro por estado de cobro.
  - **Inicio:** la hoja "Te deben" (`owed-section.tsx`).
    - Muestra el total en pesos, al tipo de cambio de cada factura, y lo vencido.
    - Lista hasta 5 facturas, primero las vencidas, con "Venció hace N días" o "Vence en N días".
  - **Lista:**
    - filtros "Por cobrar" y "Vencidas", también con `?estado=por-cobrar` y `?estado=vencidas`;
    - debajo del total, "Por cobrar", "Saldo $X", "Vencida" o "Pagada" (`CollectionLabel`).
- [x] 5.4 Datos de pago del emisor (banco, CLABE y link de pago opcional) en el perfil fiscal. Salen en el PDF y en los recordatorios.
  - **Perfil fiscal:** sección "Para que te paguen" (`payment-details-fields.tsx`), que no aparece en el onboarding.
    - Valida el dígito verificador de la CLABE y reconoce el banco con la lista oficial del SPEI (`features/fiscal-profile/data/spei-institutions.json`, 97 instituciones).
    - El servidor también valida los datos (`parsePaymentDetails`).
  - **PDF:** el bloque "Para pagar" solo aparece cuando la factura se debe. Una PUE cobrada no pide pago.
  - **Correo de la factura timbrada:** agrega el vencimiento y los datos de pago.
- [x] 5.5 Recordatorio por WhatsApp con `https://wa.me/<teléfono>?text=<mensaje>` prellenado: sin API y sin costo.
  - **Diálogo "Recordar pago":** el mensaje se puede editar y usa "usted".
  - **Número:** con 10 dígitos se antepone 52 en México y 1 en EE. UU. o Canadá. Sin teléfono, WhatsApp deja elegir el chat.
  - **Registro:** queda en `payment_reminders` al abrir el chat.
- [x] 5.6 Recordatorio por correo (plantilla react-email). Requiere un dominio verificado en Resend; hoy el remitente es `onboarding@resend.dev` (`email.service.ts`).
  - **Plantilla:** `payment-reminder.tsx` lleva el mismo mensaje del diálogo, un resumen y otra vez el XML y el PDF.
  - **Respuesta:** `replyTo` es el correo del perfil.
  - **Límite:** máximo uno al día por factura.
- [x] 5.7 Recordatorios automáticos al vencer: se hicieron como 6.6, con el cron del feature 6.

**Notas técnicas**

- **Confirmado el 2026-10-20** (RMF 2026, regla 2.7.1.39, DOF del 28 de diciembre de 2025, p. 117): una PUE que no se cobra al expedirla solo vale si el pago total se recibe a más tardar el último día del mes de emisión. Si no, se cancela y se emite otra con forma 99 y método PPD, relacionada como sustitución. El día 17 del mes siguiente solo aplica al sector financiero.
- **CLABE:** el dígito verificador usa los pesos 3, 7, 1. Los 3 primeros dígitos son el banco, según la lista de instituciones del SPEI de Banxico (CEP, consultada el 2026-10-20).
- **Migración `0014_collections.sql`:**
  - columnas `payment_terms_days` en `clients` e `invoices`, `due_date` y `awaiting_payment` en `invoices`, y `bank_name`, `clabe` y `payment_link` en `issuing_profiles`;
  - el enum `reminder_channel` y la tabla `payment_reminders`.

  Se aplicó en Neon de pruebas el 2026-10-20, con permiso, en una transacción y sin tocar datos.
- **Datos de prueba** (con permiso, 2026-10-20):
  - A-1 con 15 días de crédito (vence el 3 de noviembre);
  - AB-2 marcada por cobrar (vencida: PUE de abril);
  - el perfil KARLA con una CLABE de prueba válida (`012180001234567899`, BBVA) y un link de prueba;
  - el cliente ESCUELA KEMPER URGATE con 15 días y el teléfono 442 123 4567.

  Se mandó un recordatorio real de A-1 al buzón del usuario (Resend `01a15beb…`).
- **Totales viejos:** AB-2 es una de las facturas viejas con un total guardado ($5,000.00) distinto al de su XML ($4,999.99). El detalle muestra el del XML y la lista e Inicio el guardado. Solo pasa en esas facturas de prueba anteriores al 2026-10-16.

### 6. Igualas automáticas

- **Esfuerzo:** medio-bajo.
- **Depende de:** nada.
- **Por qué:** la mayoría factura la misma iguala cada mes y hoy usa "Duplicar". Factura.com y Alegra las programan.
- **Resultado:** "Repetir cada mes" desde una factura, con el día del mes y dos modos: dejar borrador y avisar, o timbrar y enviar.

**Subtareas**

- [x] 6.1 Tabla `recurring_invoices`: plantilla (cliente, perfil, conceptos, impuestos y moneda), día del mes, modo, próxima fecha y si está activa. Migración 0015, aplicada en Neon de pruebas el 2026-10-22.
- [x] 6.2 Ejecutor: `app/api/cron/daily/route.ts`, protegido con `CRON_SECRET`, con Vercel Cron (`vercel.json`, `0 13 * * *` = 7:00 de Ciudad de México). Es idempotente: un índice único por iguala y mes.
- [x] 6.3 Modo timbrar: si no hay timbres o el timbrado falla, deja el borrador y lo dice el correo del día. Probado hasta antes del PAC (sin `BANXICO_TOKEN`, la de dólares falla por el tipo de cambio).
- [x] 6.4 Interfaz:
  - configurar desde el detalle;
  - lista de igualas para pausar, editar y borrar;
  - marca de iguala en la lista de facturas.
- [x] 6.5 Verificación con una fecha simulada: `?today=AAAA-MM-DD` fuera de producción.
- [x] 6.6 Con el mismo cron: los recordatorios automáticos de cobro al vencer (5.7). Se activan por perfil, en "Para que te paguen".

**Notas técnicas** (2026-10-22; diseño en `docs/plans/2026-10-22-igualas-design.md`)

- **Plantilla:** JSON (`CreateInvoiceInput`) en `recurring_invoices.template`. No es un borrador escondido, porque los borradores toman folio.
  - El mes de las descripciones se guarda como `{mes}`, `{Mes}`, `{MES}` y `{año}`, y `period_offset` dice si es el mes anterior, el mismo o el siguiente.
  - Solo se cambia una descripción que nombra un solo mes ("enero a marzo" se deja igual).
- **Se crea desde una factura timbrada**, en "Más acciones". Esa factura queda como la primera de la serie (`recurring_invoice_id` y `recurring_period`), así que la primera que hace la app es la del siguiente mes que no tenga factura.
- **Atrasos del cron:** con hasta 7 días de atraso sale la factura del mes que tocaba; con más, se saltan los meses atrasados y sale la del mes en curso. Vercel no reintenta una corrida fallida.
- **Días:** del 1 al 28 o "Último día" (se guarda 31).
- **Correo del día:** un correo por usuario, al correo de su perfil predeterminado, con lo que hizo cada iguala.
- **Recordatorios automáticos:** `auto_reminders` por perfil.
  - El primero sale con 1 a 7 días de atraso, el segundo con 8 a 14; son 2 como máximo (`payment_reminders.automatic`).
  - No sale si hubo otro recordatorio en los últimos 3 días, y respeta el límite de un correo cada 24 horas.
- **Al desplegar:** poner `CRON_SECRET` en Vercel. En local ya está en `.env.local`.
- **Datos de prueba:**
  - iguala de la A-1: día 1, borrador; la A-2 es su borrador de noviembre;
  - iguala del borrador en dólares de Acme: último día, timbrar; la "3" es su borrador de noviembre;
  - el perfil de KARLA tiene activados los recordatorios automáticos.

### 7. Tu mes ante el SAT

- **Esfuerzo:** bajo-medio.
- **Depende de:** 5 (y de 1 para las PPD).
- **Por qué:** Heru cobra $599–799/mes por declarar. El usuario quiere saber cuánto va a pagar y si el prellenado del SAT saldrá bien.
- **Resultado:** una hoja por mes con lo cobrado, el ISR estimado, lo retenido, el IVA, las alertas del prellenado y el avance contra el tope anual.

**Subtareas**

- [ ] 7.1 Servicio de resumen mensual por perfil 626: ingresos cobrados sin IVA, ISR por tabla, ISR retenido, IVA trasladado cobrado e IVA retenido.
- [ ] 7.2 Tabla mensual del art. 113-E de la LISR, parametrizada por año **(verificar vigencia)**.
- [ ] 7.3 Alertas:
  - PUE sin cobrar;
  - PPD cobrada sin REP;
  - cliente persona moral sin retención;
  - cancelaciones en proceso;
  - ingresos del año al 80 % y al 95 % del tope.
- [ ] 7.4 Página "Tu mes" (o un bloque en el Inicio) con selector de mes y la leyenda "Estimación; no sustituye tu declaración".
- [ ] 7.5 Si se aprueba la reforma 2027, agregar el tope de $5 M y la opción de IVA de 7 % sobre lo cobrado.

**Notas técnicas**

- Tabla mensual RESICO de personas físicas:

  | Ingresos del mes, hasta | Tasa |
  |---|---|
  | $25,000.00 | 1.00 % |
  | $50,000.00 | 1.10 % |
  | $83,333.33 | 1.50 % |
  | $208,333.33 | 2.00 % |
  | $3,500,000.00 | 2.50 % |

- La tasa se aplica a todo el ingreso del mes; no es marginal.
- ISR a pagar = ingresos cobrados del mes × tasa − ISR retenido por personas morales.
- El IVA acreditable de gastos queda fuera, porque necesitaría los CFDI recibidos.

### 8. Paquete para tu contador

- **Esfuerzo:** bajo para el ZIP; medio para el acceso.
- **Depende de:** nada (el resumen mejora con 5).
- **Por qué:** el contador pide los XML y un resumen cada mes, y los contadores son el canal de referidos.
- **Resultado:** "Descargar mes" baja un ZIP con los XML y PDF del mes (facturas y REP) y un resumen en Excel o CSV. Después, acceso de solo lectura para el contador.

**Subtareas**

- [x] 8.1 ZIP con los XML (de `xmlContent` o R2) y los PDF (de R2 o generados), con `fflate` 0.8.3 (aprobada el 2026-10-22).
- [x] 8.2 Resumen en CSV (sin dependencias), en UTF-8 con BOM. Columnas:
  - folio, fecha y UUID;
  - RFC y nombre del cliente;
  - subtotal, IVA, ISR retenido, IVA retenido y total;
  - moneda y tipo de cambio;
  - método de pago, estatus y cobro.
- [x] 8.3 "Para tu contador" en Facturas, con selector de mes (los últimos 12, con cuántos documentos tiene cada uno) y de RFC.
- [x] 8.4 Link privado para el contador (`/contador/<token>`), sin cuenta: se cancela en un clic y muestra cuándo lo abrió.

**Notas técnicas** (2026-10-22; diseño en `docs/plans/2026-10-22-paquete-contador-design.md`)

- **Qué entra en el mes:** los CFDI de un perfil timbrados en el mes (hora de Ciudad de México), cancelados incluidos con su acuse.
- **Archivos:** el ZIP se sube a R2 en `exports/<usuario>/<perfil>/<mes>.zip` (se reemplaza) y se baja con una URL firmada de 10 minutos que lo descarga con su nombre (`getDownloadSignedUrl`).
  - Un archivo que no se puede leer no detiene el paquete: queda listado en `LEEME.txt`.
- **CSV:** las celdas de texto que empiezan con `=`, `+`, `-` o `@` llevan un apóstrofo, para que Excel no las ejecute (el nombre de un cliente lo escribe una persona).
- **Token del link:** se busca por su SHA-256 y se guarda cifrado (AES-256-GCM, la misma llave de las contraseñas del CSD) para que el usuario lo pueda copiar otra vez.
  - Es un cambio sobre el diseño, que decía "solo el hash".
  - Va en `shared/utils/share-token.ts` y lo reutiliza el feature 14.
- **Migración 0016** (`accountant_links`), aplicada en Neon de pruebas el 2026-10-22.
- `/contador(.*)` queda fuera de Clerk en `middleware.ts`; la página no se indexa y no manda el token como referer.

### 9. IA para la clave SAT

- **Esfuerzo:** bajo, más la carga del catálogo completo.
- **Depende de:** nada (mejor con 3).
- **Por qué:** elegir la ClaveProdServ es lo más confuso de facturar. Factura IA y FactuCat ya lo resuelven con IA.
- **Resultado:** el usuario escribe el concepto ("diseño de logotipo") y "Sugerir clave" propone ClaveProdServ y ClaveUnidad con una razón corta; el usuario confirma.

**Subtareas**

- [ ] 9.1 Cargar los catálogos oficiales completos `c_ClaveProdServ` y `c_ClaveUnidad`. El seed actual tiene descripciones escritas a mano; esto cierra ese pendiente.
- [ ] 9.2 Buscar candidatas en la base (`ILIKE` o `pg_trgm`). El modelo elige entre ellas, sin inventar claves, y se valida que la clave exista.
- [ ] 9.3 Server action con la API de Anthropic (modelo `claude-haiku-5-5`, variable `ANTHROPIC_API_KEY`), con límite por usuario.
- [ ] 9.4 Botón "Sugerir clave" junto al combobox del concepto.
- [ ] 9.5 Medir cuántas sugerencias se aceptan.

## Fase 3 — Para después

Se detallan al llegar a ellos.

### 10. Notas de crédito

- CFDI de egreso para descuentos, devoluciones o ajustes: `TipoDeComprobante="E"` y `CfdiRelacionados TipoRelacion="01"` hacia la factura **(verificar en la guía de llenado las claves de producto, unidad y forma de pago)**.
- Reutiliza `cfdiType` (1) y `CfdiRelacionados` (2), y reduce el saldo por cobrar (5).

### 11. Factura global

- Para quien cobra a personas sin RFC (terapeutas, clases).
- Receptor: `XAXX010101000` "PUBLICO EN GENERAL", régimen 616, uso `S01` y código postal igual al `LugarExpedicion`.
- Nodo `cfdi:InformacionGlobal` (`Periodicidad`, `Meses` y `Año`), que el builder y la cadena original aún no tienen.
- Conceptos con `ClaveProdServ="01010101"` y `ClaveUnidad="ACT"`, con el número de ticket en `NoIdentificacion`.

### 12. App instalable (PWA)

- `app/manifest.ts`, íconos con el sello FF, `display: standalone` y `theme_color`. Sin modo offline al principio.

### 13. Bot de WhatsApp

- Facturar desde WhatsApp con la API de WhatsApp Business de Meta.
- Tiene costo por conversación y pide verificar el negocio: evaluarlo antes de construir.

### 14. Link para que el cliente capture sus datos

- Link público con token por cliente, donde captura RFC, razón social, régimen, código postal y uso CFDI. La constancia es opcional.
- El SAT multa condicionar la factura a la constancia (comunicado 04/2026).
- La ruta debe quedar fuera de la protección de Clerk en `middleware.ts`.

**Hecho el 2026-10-22** (diseño en `docs/plans/2026-10-22-link-datos-cliente-design.md`):

- [x] 14.1 Tabla `client_data_requests` (migración 0017, aplicada en Neon de pruebas el 2026-10-22): token por solicitud, de un solo uso, vence a los 30 días y deja de funcionar tras 20 usos (constancias leídas más envíos).
- [x] 14.2 Clientes: "Pedir datos a un cliente" para uno nuevo, y un botón por cliente en México para pedirle que actualice sus datos. Se manda por WhatsApp, por correo desde el programa del usuario (`mailto:`) o copiado. Arriba de la lista, "Esperando sus datos", para copiar o cancelar cada link.
- [x] 14.3 Página pública `/datos/<token>`:
  - pensada para el celular, con la constancia opcional (una acción que valida el token);
  - régimen y uso CFDI filtrados por el RFC;
  - el correo para recibir las facturas es obligatorio.
- [x] 14.4 Al enviar, se valida con el esquema y el servicio de clientes (incluido `assertTaxRegimeFitsRfc`):
  - se guarda en el cliente del link o, si el RFC ya existe, en ese cliente, sin duplicar; se conservan los días de crédito;
  - al usuario le llega un correo ("… llenó sus datos fiscales"); si el correo falla, los datos se quedan guardados.
- [x] 14.5 De paso: `extractCsfAction` ahora exige sesión. Antes, cualquiera podía usarla para leer PDFs y consultar al SAT.
- **Datos de prueba:** la clienta PAOLA MOLINA LOPEZ (MOLP900215KL4) se creó llenando un link; se puede borrar.

## Quejas de quien factura (2026-10-26)

Salen de la investigación de quejas del 2026-10-25: eran las dos que la app aún no resolvía.

### 15. Aviso de CSD por vencer

- **Por qué:** el CSD vence a los 4 años y, sin aviso, el usuario se entera cuando ya no puede timbrar; tramitar uno nuevo pide Certifica, CertiSAT Web y la e.firma vigente.
- **Resultado:**
  - aviso en Inicio desde 30 días antes, o si ya venció, con «Cómo tramitarlo» (los 3 pasos del trámite 17507 del SAT) y «Subir CSD nuevo»;
  - en Perfiles fiscales, el sello del CSD dice «CSD vence en N días» en ocre;
  - correo 30, 7 y 1 día antes desde el cron diario. Cada CSD coincide un solo día con cada aviso, así que no hace falta guardar que se envió ni una migración;
  - al timbrar con el CSD vencido, el error dice la fecha y qué hacer, con el botón «Ir a Perfiles fiscales».
- **Código:**
  - `features/fiscal-profile/utils/csd-expiry.ts` (`csdExpiry`, días en hora de la Ciudad de México);
  - `components/csd-expiry-notice.tsx` y `components/csd-renewal-guide.tsx`;
  - `services/csd-reminders.service.ts` y la plantilla `csd-expiring.tsx`;
  - `runDailyJobs` devuelve `csdReminders`.
- **Verificado (2026-10-26):**
  - pruebas de `csdExpiry` (límites del día en México);
  - simulación de solo lectura del cron: avisa a 30, 7 y 1 día, y no a 31, 29 ni el último día;
  - el correo se generó en HTML y no se envió;
  - Inicio y Perfiles fiscales a 375 y 1280 px, subiendo el plazo a 400 días solo para la prueba.
- **Correo de prueba:** se envió uno el 2026-10-26, con permiso del usuario, como si fuera el 2027-04-18 (EKU9003173C9, a 30 días). Llegó a `OVERRIDE_TO`; id de Resend `01a17982-8eaa-7946-b39e-f7e4e06364c3`.
- **Pendiente:** el link al trámite del SAT responde 403 desde fuera de México; revisarlo desde México.

### 16. Errores del SAT en palabras simples

- **Por qué:** el usuario veía el mensaje técnico del PAC («CFDI40145 - El campo Nombre del receptor…») sin saber qué corregir.
- **Resultado:**
  - `features/stamping/utils/stamping-errors.ts` traduce los rechazos comunes y conserva el código entre paréntesis;
  - cada traducción dice dónde se corrige: `client`, `profile`, `invoice` o `support` (error nuestro o de SW);
  - el aviso de «No se timbró la factura» dura 15 s y trae el botón que lleva ahí;
  - lo usan las facturas, los complementos de pago y el resumen diario de igualas;
  - un código que no está en la lista muestra el mensaje de SW tal cual.
- **Fuentes:** la «Matriz de códigos de error para el CFDI 4.0» del SAT (archivo `MatrizDeErrores_CFDI_v40_20260325.xls`, página del Anexo 20) y los códigos 3xx y 4xx de developers.sw.com.mx. Además, S2000: SW se quedó sin saldo.
- **Verificado (2026-10-26):** pruebas de la traducción, y un timbrado real en el sandbox de SW, que sigue sin saldo. Salió el aviso traducido del S2000; el borrador quedó libre y no se usó timbre.
- **Pendiente:** traducir los códigos del complemento de pago (CRP…) cuando aparezcan en pruebas.

## Fuera de alcance

Nómina, Carta Porte, inventario o punto de venta, autofacturación, API pública y presentar declaraciones. Son otro tipo de cliente o compiten con los contadores, que son el canal.

## Vigilar

- **Facturas en euros y otras monedas** (feature 4 deja solo MXN y USD): el CFF (art. 20, sexto párrafo) las convierte con la tabla de equivalencias que Banxico publica cada mes, ya pasado el mes.

- **Reforma RESICO 2027:** sube el tope a $5 M y agrega un IVA opcional de 7 % sobre lo cobrado. Diputados la aprobó el 13–14 de octubre de 2026 y el Senado tiene hasta el 31 de octubre. Afecta a 7.
- ~~**Cancelación de REP:** falta saber si la exclusión es nueva de 2026.~~ Resuelto el 2026-10-19: es nueva. Según un aviso de SW del 12 de enero de 2026, desde el 1 de enero de 2026 los REP piden aceptación sin importar el monto.

## Antes de lanzar (fuera de este plan)

- Sentry y PostHog en la app.
- Landing: los TODO de `src/config.ts` (dominio, nombre o razón social, domicilio, WhatsApp y ciudad de los tribunales) y la revisión con un abogado. El aviso y los términos ya siguen la LFPDPPP de 2025 y la LFPC (2026-10-23); ver la bitácora.
- ~~Landing vieja publicada: `facturafast-landing.pages.dev` (Cloudflare Pages) sirve `main`, con testimonios inventados, "50 %" de descuento y "quedan lugares".~~ Resuelto el 2026-10-24: a pedido del usuario, la landing nueva se subió a `main` (`9d075de`) y Cloudflare la publicó. Quedan visibles los "[… pendiente]" legales, y los botones y el correo apuntan a `facturafast.mx` hasta definir el dominio.
- App: aviso de privacidad simplificado (LFPDPPP art. 16, fr. II) en el registro y en `/datos/<token>`, con links a términos y privacidad. Hoy la app no enlaza ninguno de los dos.
- Marca: en `facturafast.mx` opera otro sistema llamado "Facturafast" (dominio de 2020). Revisar la marca en el IMPI antes de lanzar.
- Decidir si los timbres de bienvenida suben de 3 a unos 10 (en la app y en `FREE_STAMPS` de la landing).
- ~~Perfil fiscal y onboarding: filtrar el régimen por tipo de persona (RFC de 12 o 13 caracteres), como ya hace `client-form.tsx` con `applicableToFisica` y `applicableToMoral`. Hoy una persona física puede guardar el 601, y su primer timbrado falla con `CFDI40141` (confirmado en el sandbox el 2026-10-16). Archivos: `features/fiscal-profile/components/issuing-profile-form.tsx` y `features/onboarding/components/fiscal-profile-step.tsx`.~~ Resuelto el 2026-10-22: el formulario filtra el régimen por el RFC y lo borra si deja de aplicar; el servidor también lo valida (`assertTaxRegimeFitsRfc`), en perfiles y en clientes.
- ~~Errores del PAC: `sw-client.service.ts` mostraba `messageDetail` antes que `message`.~~ Resuelto el 2026-10-19: se muestra `message` (código y motivo). Los códigos comunes se traducen desde el 2026-10-26 (feature 16).
- ~~`xml-seal.service.ts` imprime en consola la cadena original y el XML completo (con RFC y nombre del cliente) en cada timbrado.~~ Resuelto el 2026-10-22.
- Cargar los catálogos oficiales completos `c_ClaveProdServ` y `c_ClaveUnidad`: era la 9.1 y sigue haciendo falta aunque el feature 9 quedó fuera del MVP. El seed actual tiene descripciones escritas a mano.
- Ya están dentro del plan: la prueba de timbrado real (1.1) y si cancelar consume timbre (2.7).

## Fuentes

- Complemento de pagos 2.0: [esquema](http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd) y [XSLT de la cadena original](http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xslt).
- [Anexo 20, CFDI 4.0 y guías de llenado (SAT)](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm).
- [Servicio de consulta de estatus del SAT (WSDL)](https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc?wsdl) y [notas de CfdiUtils](https://mintlify.wiki/eclipxe13/CfdiUtils/components/sat-status).
- [SW Sapien, portal de desarrolladores](https://developers.sw.com.mx/).
- [API SIE de Banxico](https://www.banxico.org.mx/SieAPIRest/service/v1/).
- [SAT: la constancia no es requisito para facturar](https://www.gob.mx/sat/prensa/aclara-sat-que-constancia-de-situacion-fiscal-no-es-requisito-para-emitir-factura-04-2026).

## Bitácora

### 2026-10-16

- Se crea este plan a partir de la comparación con la competencia. Aún no se implementa nada.
- Punto de partida: la rama `feat/talonario-resico`, con cambios sin commit (diseño Talonario, retenciones RESICO y la migración 0009 aplicada en la base Neon de pruebas).
- Siguiente: feature 1, subtarea 1.1.

### 2026-10-16 — primera sesión con `/facturafast`

- **1.1 hecha en seco.** Con el código de la app (builder, sellado y cliente de SW), sin escribir en la base, gastar timbres, subir a R2 ni mandar correos:
  - SW aceptó una factura PPD de emisor 626 a persona moral con ISR 1.25 % e IVA 10.6667 % retenidos (UUID `e50d5d26-…`), con los totales de `computeCfdiAmounts`;
  - con el régimen guardado (601), el mismo perfil de persona física da `CFDI40141`.
- **Corrección:** `suggestWithholdings` sugería ISR 1.25 % a emisores RESICO persona moral. Ahora recibe al emisor y solo sugiere retenciones si es persona física. También se ajustó el texto de ayuda del formulario para el caso de una persona moral que factura a otra.
  - Archivos: `features/invoicing/utils/cfdi-amounts.ts` y `features/invoicing/components/invoice-form.tsx`.
  - Verificación: 6 casos con un script en el scratchpad, `tsc` sin errores y lint con 0 errores (3 advertencias que ya existían).
- **Investigación:** se confirmaron con fuentes oficiales el orden de la cadena original (`Pagos20.xslt`), la estructura (`Pagos20.xsd`) y las reglas de cálculo, plazo y cancelación.
- **Diseño:** `docs/plans/2026-10-16-complemento-de-pago-design.md`, con tablas propias de cobros. La cancelación de REP pasó al feature 2 (2.9).
- **Pendientes nuevos en "Antes de lanzar":** el filtro de régimen por tipo de persona en perfiles, el mensaje de error del PAC y los logs de `xml-seal.service.ts`.
- **Siguiente:** que el usuario apruebe el diseño (1.2). Luego, esquema y migración (sin aplicar a Neon sin permiso) y la subtarea 1.3.

### 2026-10-19 — feature 1 terminado

- **Aprobaciones del usuario:**
  - el diseño;
  - aplicar la migración 0010 en Neon de pruebas (hecho a mano, en una transacción);
  - preparar datos de prueba (perfil de KARLA a 626, cliente ESCUELA KEMPER URGATE y hasta 3 timbres);
  - que el correo de prueba le llegue a su buzón por el `OVERRIDE_TO`.
- **Subtareas:**
  - **1.2:** esquema `payments.schema.ts` (`paid_on` como fecha y `qr_code`) y migración `0010_payments.sql`, aditiva.
  - **1.3:** cálculo en `features/payments/utils/payment-amounts.ts`, con los vectores del diseño y 20 000 cobros aleatorios dentro de la tolerancia del PAC.
  - **1.4 y 1.5:**
    - `payment-xml-builder.service.ts` y la secuencia de `Pagos20.xslt` en `xml-seal.service.ts`;
    - auxiliares compartidos en `features/stamping/utils/cfdi-xml.ts`;
    - SW aceptó 3 REP en seco.
  - **1.6:**
    - `payment.service.ts`, con la reserva en transacción (bloqueo de la factura y folio por perfil), el XML sellado guardado antes del PAC y el reintento seguro;
    - `sw-client.service.ts` recupera el timbre con el 307 y muestra `message`, lo que resuelve uno de "Antes de lanzar".
  - **1.7:** el diálogo "Registrar cobro", el talón perforado con los cobros y el saldo en la lista; "Cancelar factura" pasó al menú ⋯.
  - **1.8:** PDF del REP leído de su XML (una página) y correo `payment-stamped.tsx`.
  - **1.9:** bloqueo de la cancelación con REP vigentes, en el servicio y en los diálogos.
  - **1.10:** factura PPD, REP 1 por el servicio (con respuesta perdida y reintento) y REP 2 desde la interfaz, con PDF, R2 y correo.
- **Verificación:**
  - `tsc` sin errores; lint con 0 errores y las 3 advertencias que ya existían;
  - capturas a 1280, 1024, 768 y 375 px, en claro y oscuro;
  - scripts y capturas en el scratchpad de la sesión.
- **Pendientes que deja:**
  - cancelar y sustituir un REP (2.9);
  - un cobro que salde varias facturas;
  - REP en dólares (4);
  - la cuenta de pruebas quedó con 0 timbres;
  - P-1 no tiene PDF porque se timbró antes de la 1.8.
- **Siguiente:** feature 2, "Corregir factura y estatus de cancelación". Es de esfuerzo medio-bajo, pero toca la cancelación, así que primero lleva un diseño corto (`docs/plans/`) y la aprobación del usuario.

### 2026-10-19 — diseño del feature 2

- **Feature 1:** el usuario confirmó que el correo del REP P-2 le llegó y se ve bien.
- **Feature 2 pasa a `en curso`.** Dos agentes investigaron:
  - las reglas del SAT: la RMF 2026, el CFF, las preguntas frecuentes de cancelación 2026, el manual y las guías de llenado;
  - el servicio de consulta del SAT y la API de SW.

  Lo confirmado está en las notas del feature, en "Confirmado".
- **Diseño:** `docs/plans/2026-10-19-corregir-factura-y-cancelacion-design.md`:
  - columnas nuevas en `invoices` y `payments` (relación, solicitud de cancelación y última consulta al SAT), en una migración aditiva `0011`;
  - "Corregir factura" pide la cancelación con 01 al timbrar la nueva. Si falla, la original queda "Por cancelar" con un botón;
  - si cambió el RFC, primero se cancela con 02;
  - la consulta va directo al SAT, y a la copia de pruebas de SW cuando se usa el sandbox;
  - solo el último REP se cancela o corrige.
- **Hallazgo:** `cancelInvoice` no revisa el código por UUID de la respuesta de SW (205, 207, 208 y 212 llegan como `success`). Se corrige en 2.5.
- **Archivos:** solo el diseño y este plan. No se tocó código ni la base.
- **Siguiente:** que el usuario apruebe el diseño. Después:
  - 2.1, esquema y migración. Hay que pedir permiso antes de aplicarla en Neon;
  - 2.2, XML en seco en el sandbox.

### 2026-10-19 — feature 2 programado; faltan las pruebas con timbrado

- **Aprobaciones del usuario:**
  - el diseño;
  - aplicar la migración 0011 en Neon (hecho a mano, en una transacción);
  - datos de prueba (timbres, facturas nuevas, cancelar una factura vieja, corregir y cancelar el P-2);
  - correos a su buzón.
- **Hecho y verificado:**
  - **2.1:** esquema y migración `0011_cancellation_status.sql`.
  - **2.4:** `sat-status.service.ts`. Consulta real a la copia de SW ("Vigente") y al SAT (602).
  - **2.5:** `cancellation.service.ts`. Primera cancelación real en el sandbox (`123123-0`): SW respondió 201 y la factura quedó en proceso, no cancelada.
  - **2.6:** sellos, avisos, diálogos de cancelar y corregir, menús, formulario y PDF. Capturas a 375, 768, 1024 y 1280 px, en claro y oscuro.
  - **2.7:** cancelar no gasta timbres de SW (saldo medido antes y después).
- **Hecho, sin la prueba con timbrado:**
  - **2.2:** `CfdiRelacionados` y la cadena original.
  - **2.3:** "Corregir factura" (borrador, bloqueos y cancelación automática con 01).
  - **2.9:** cancelar y corregir el último REP. El P-2 se canceló desde el talón.
- **Hallazgo corregido:** `cancelInvoice` tomaba como éxito los rechazos que SW manda dentro de `success` (205, 207, 208, 212).
- **Bloqueo:** la cuenta de pruebas de SW se quedó sin timbres (30 de 30; `S2000 - El saldo del cliente se ha agotado`). Sin timbres no se puede:
  - comprobar que SW acepta el XML con la relación;
  - timbrar la corrección We-1 y ver la cancelación automática de la We-0;
  - corregir un REP.

  El usuario tiene que pedirle a SW más timbres de prueba.
- **Revisión:** `tsc` sin errores; lint con 0 errores y las 3 advertencias que ya existían; sin errores en el log del servidor.
- **Siguiente:**
  - cuando haya timbres de prueba en SW, hacer la 2.8 (We-1, una corrección nueva y un REP corregido) y cerrar las subtareas 2.2, 2.3 y 2.9;
  - mientras tanto, el feature 3 ("Catálogo de servicios"), que es de esfuerzo bajo y no depende del 2.

### 2026-10-19 — feature 3 terminado

- **Aprobación del usuario:** aplicar la migración 0012 (hecho a mano, en una transacción). El feature es de esfuerzo bajo, así que va sin diseño previo.
- **Hecho:**
  - tabla `catalog_items` (`database/schemas/catalog.schema.ts`, migración `0012_catalog_items.sql`);
  - módulo `features/catalog/`;
  - página `/catalog` "Mis servicios" en la navegación;
  - en el formulario de factura, "De mis servicios" y "Guardar en mis servicios", con el precio convertido según el IVA.
- **También:** `CLAUDE.md` describe los módulos `payments` y `catalog` y la variable `SAT_STATUS_URL`.
- **Verificación:**
  - 14 casos del servicio contra la base;
  - el flujo completo en el navegador;
  - capturas a 375, 768, 1024 y 1280 px, en claro y oscuro;
  - `tsc` sin errores; lint con 0 errores y las 3 advertencias que ya existían.
- **Siguiente:**
  - el feature 2 sigue bloqueado hasta tener timbres de prueba en SW;
  - toca la fase 2, con el feature 4 ("Clientes del extranjero en dólares"). Es de esfuerzo medio, así que primero lleva un diseño corto y la aprobación del usuario. Tiene reglas por confirmar (uso CFDI S01, `Exportacion` y la serie de Banxico) y necesita un token gratuito de Banxico.

### 2026-10-19 — diseño del feature 4

- **Feature 4 pasa a `en curso`.** Dos agentes confirmaron las reglas marcadas "(verificar)":
  - S01 y `Exportacion="01"`;
  - la serie SF60653 de Banxico, comprobada contra todo 2026;
  - el IVA 0 % (LIVA art. 29 y RLIVA arts. 58 y 61);
  - el complemento de pago en dólares.

  El detalle está en las notas del feature.
- **Hallazgo:** `createClient` no deja repetir RFC, y todos los clientes del extranjero comparten `XEXX010101000`.
- **Diseño:** `docs/plans/2026-10-19-clientes-extranjero-design.md`:
  - catálogos c_Pais y c_Moneda completos;
  - caché del tipo de cambio;
  - clientes con país, número fiscal e IVA elegido;
  - facturas y complementos en USD;
  - Inicio en pesos.
- **Archivos:** solo el diseño y este plan.
- **Siguiente:** que el usuario lo apruebe. Después:
  - pedir permiso para la migración 0013 y la carga de catálogos;
  - el usuario saca su token de Banxico (gratis).

### 2026-10-20 — feature 4 programado; falta timbrar en el sandbox

- **Aprobaciones del usuario:**
  - el diseño;
  - aplicar la migración 0013 y cargar los catálogos c_Pais y c_Moneda (hecho en una transacción);
  - seguir sin token de Banxico, con el tipo de cambio escrito a mano.
- **Hecho:**
  - 4.1 clientes del extranjero;
  - 4.2 catálogos;
  - 4.3 facturas en dólares;
  - 4.5 XML;
  - 4.6 IVA 0 %;
  - 4.7 Inicio en pesos;
  - 4.9 complemento de pago en dólares.

  El código de la 4.4 está listo; falta probarlo con el token real.
- **Archivos clave:**
  - `features/clients/utils/foreign-client.ts`;
  - `features/exchange-rates/`;
  - `receptorXml` en `features/stamping/utils/cfdi-xml.ts`;
  - `computePaymentTotals` en `features/payments/utils/payment-amounts.ts`;
  - `invoice-form.tsx` y `register-payment-dialog.tsx`.

  `BANXICO_TOKEN` quedó documentado en `CLAUDE.md` y en `.env.example`.
- **Hallazgo corregido:** la lista de facturas fallaba desde la 2.9. `getPaidAmountsByInvoice` armaba el `not exists` con un `alias` dentro de `sql` y Postgres respondía `relation "substitute" does not exist`. Ahora usa `notExists(db.select().from(substitute)…)`, y se probó contra la base.
- **Verificación:**
  - `tsc` sin errores; lint con 0 errores y las 3 advertencias que ya existían;
  - XML en seco y pruebas de importes;
  - capturas a 375, 768 y 1280 px, en claro y oscuro;
  - lista e Inicio sin errores en el log.
- **Bloqueado:** la cuenta de pruebas de SW sigue en 0 timbres (30 de 30; los 20 que compró el usuario son de la app, no de SW). Sin ellos no se puede hacer la 4.8 ni las pruebas con timbrado del feature 2 (2.2, 2.3, 2.8 y 2.9).
- **Siguiente:**
  - con timbres de SW, hacer la 4.8 y la 2.8;
  - con el token de Banxico, probar la 4.4;
  - mientras tanto, el feature 5 ("Cobranza"). Es de esfuerzo medio-bajo, así que primero lleva un diseño corto.

### 2026-10-20 — feature 5 (Cobranza) programado

- **Aprobaciones del usuario:**
  - el diseño (`docs/plans/2026-10-20-cobranza-design.md`);
  - aplicar la migración 0014 y preparar datos de prueba;
  - un recordatorio por correo a su buzón;
  - levantar el servidor solo para las pruebas. Pidió detener la sesión de :3000 al empezar; quedó apagado al terminar.
- **Hecho:** de la 5.1 a la 5.6. Lo nuevo:
  - el módulo `features/collections/` (estado de cobro, vencimiento, mensaje, WhatsApp, servicio, acciones y componentes);
  - "Para que te paguen" en el perfil fiscal, con la CLABE validada y el banco reconocido;
  - "Días de crédito" en el cliente y la factura;
  - el vencimiento y el estado de una PUE al timbrar;
  - "Recordar pago" por WhatsApp o correo;
  - "Marcar por cobrar" y "Sustituir por una factura PPD";
  - filtros de cobro en la lista y "Te deben" en el Inicio;
  - "Para pagar" en el PDF y en el correo de la factura.
- **Reglas confirmadas:**
  - RMF 2026, regla 2.7.1.39 (PUE pagada a más tardar a fin de mes; si no, sustituirla por una PPD);
  - el algoritmo de la CLABE;
  - la lista oficial de instituciones del SPEI de Banxico;
  - el formato de `wa.me`.
- **Corregido de paso:**
  - el correo del complemento decía "USD 5,000.00 MXN" y el de la factura "USD 2,500.00 USD";
  - en el formulario de factura, el método PUE dice "En el mes" en lugar de "Ya pagado";
  - el encabezado del detalle partía el título a 1280 px.
- **Verificación:**
  - 56 casos de las funciones puras (`scratchpad/cobranza/test-utils.ts`);
  - el servicio contra la base (A-1 parcial: saldo $5,408.33, vence el 3 de noviembre);
  - el borrador PPD que sustituye a AB-2: PPD, forma 99 y relación 04. Se reutiliza y se borró después;
  - el flujo completo en el navegador (`scratchpad/cobranza-ui.cjs`), sin abrir WhatsApp de verdad: se interceptó la petición a `wa.me`;
  - un correo real de recordatorio, y el segundo bloqueado por el límite de 24 horas;
  - el PDF de A-1 con "Para pagar";
  - capturas a 375, 768 y 1280 px, en claro y oscuro;
  - `tsc` sin errores; lint con 0 errores y las 3 advertencias que ya existían; sin errores en el log del servidor.
- **Falta:**
  - con timbres de SW, ver el vencimiento al timbrar, el PDF y el correo de una factura nueva (junto con la 4.8 y la 2.8);
  - la 5.7 va con el cron del feature 6 (6.6).
- **Siguiente:** el feature 6 ("Igualas automáticas"). Es de esfuerzo medio-bajo, así que primero lleva un diseño corto. Hay que decidir dónde se despliega el cron (Vercel Cron u otro).

### 2026-10-22 — alcance del MVP; features 6, 8 y 14, y dos arreglos

- **Decisiones del usuario:**
  - el MVP es de los features 1 a 6, 8 y 14;
  - el 7 espera la reforma RESICO 2027;
  - el 9, el 11, el 12 y el 13 quedan fuera;
  - el 10 (notas de crédito) también: lo pidió y luego contestó "Quita esto" a su diseño. Se entendió que lo quitaba; el diseño, con las reglas del SAT confirmadas, queda guardado.
- **Aprobaciones:**
  - los diseños de 6, 8 y 14;
  - la dependencia `fflate`;
  - las migraciones 0015 a 0017 y datos de prueba;
  - correos de prueba a su buzón.
- **Arreglos de "Antes de lanzar":**
  - **Régimen y tipo de persona:** el perfil fiscal, el onboarding y el formulario de clientes solo ofrecen los regímenes que corresponden al RFC, y borran el que deja de aplicar. El servidor también lo valida.
  - **Errores del perfil fiscal:** las acciones devuelven `{ error }` en vez de lanzarlo, porque Next.js oculta en producción el mensaje de un error lanzado (como "Verifica la contraseña" del CSD).
  - **Consola:** el sellado ya no imprime la cadena original ni el XML.
- **Feature 6:** `features/recurring/`, `app/api/cron/daily`, `vercel.json` y la migración 0015.
  - Cubre "Repetir cada mes", "Facturas de cada mes", la plantilla editable con el formulario de factura, el correo del día y los recordatorios automáticos de cobro.
  - Al probarlo se corrigió un error de diseño: un cron atrasado unos días hacía la factura del mes equivocado.
- **Feature 8:** `features/accountant/`, `/contador/<token>` y la migración 0016.
- **Feature 14:** el servicio de solicitudes en `features/clients/`, `/datos/<token>` y la migración 0017.
  - De paso, `extractCsfAction` ahora exige sesión.
- **Verificación:**
  - **Pruebas en el scratchpad (`mvp/`):** 29 casos de calendario y meses, 19 del servicio de igualas, 4 de atrasos del cron, 19 de CSV, meses y tokens, 13 del paquete y del link, 15 de las solicitudes de datos y 8 del régimen. Todo contra la base de pruebas y R2.
  - **Cron:** con su secreto y fechas simuladas; sin secreto responde 401.
  - **Interfaz:** recorridos completos en Chrome (`igualas-ui.cjs`, `contador-ui.cjs`, `datos-ui.cjs`) a 375, 768 y 1280 px, en claro y oscuro.
  - **Correos reales al buzón del usuario:** el correo del día de las igualas, un recordatorio automático (el segundo lo frenó el límite de 24 horas) y el aviso de datos recibidos.
  - **Revisión del código:** `tsc` sin errores; lint con 0 errores y las 3 advertencias que ya existían.
  - **Build:** `next build` de producción compila, y las páginas tocadas cargan sin errores en el servidor de producción.
  - **Aviso de hidratación:** salió en desarrollo al compilar una ruta por primera vez y no se reproduce.
- **Falta:**
  - con timbres de SW: el modo "Timbrar y mandar" de las igualas, más lo que ya esperaba (2.2, 2.3, 2.8, 2.9, 4.8 y la parte de timbrado del 5);
  - al desplegar: `CRON_SECRET` en Vercel y un dominio verificado en Resend (hoy todo correo llega al buzón del usuario).
- **Siguiente:**
  - el feature 7 después del 31 de octubre, cuando el Senado decida la reforma;
  - mientras tanto, la lista "Antes de lanzar": Sentry y PostHog, los datos legales de la landing, los timbres de bienvenida y los catálogos oficiales del SAT.

### 2026-10-23 — textos legales de la landing

- **Aviso de privacidad** (`facturafast-landing/src/pages/privacidad.astro`), según la LFPDPPP publicada el 20 de marzo de 2025 (texto de la Cámara de Diputados, última reforma DOF 14-11-2025):
  - el contenido del art. 15: responsable con domicilio, datos, finalidades con y sin consentimiento, cómo limitar el uso, derechos ARCO y cómo se avisan los cambios;
  - las transferencias sin consentimiento citan el art. 36 (decía 37, de la ley abrogada). SW, Conekta y la nube quedan como encargados, y el SAT y las autoridades como transferencias;
  - los datos de los clientes del usuario se tratan como encargados, incluidos los del link de datos. El link para el contador queda dicho;
  - plazos ARCO del art. 31: 20 días para responder y 15 para aplicar, ampliables una vez. La autoridad es la Secretaría Anticorrupción y Buen Gobierno.
- **Términos** (`terminos.astro`), según la LFPC (última reforma DOF 12-12-2025):
  - domicilio y teléfono antes de la compra (art. 76 Bis, fr. III), también en el pie de página;
  - precios con IVA incluido (art. 7 Bis): la app cobra exactamente el precio del paquete;
  - los cambios a los términos no tocan los timbres ya comprados y se avisan con 15 días (art. 90, fr. I), y queda a salvo acudir a la PROFECO (art. 90, fr. VI).
- **Config** (`src/config.ts`): `LEGAL_CITY` y `PHONE_DISPLAY` nuevos; los TODO dicen qué artículo pide cada dato.
- **Verificación:** `npm run build` compila; las dos páginas a 375 y 1280 px, sin desbordes ni errores de consola.
- **Hallazgos:** la landing vieja está publicada en `facturafast-landing.pages.dev`; `facturafast.mx` es de otra persona; el repo de la landing es privado y el de la app, público (sin secretos en su historial).
- **Falta:** los datos del usuario (nombre o razón social, domicilio, WhatsApp, ciudad y dominio), la revisión de un abogado y el aviso simplificado en la app.

### 2026-10-24 — mejoras de la landing (rama `feat/landing-mejoras`, sin commit)

- Sección nueva "Lo que hace por ti durante el mes" (`Month.astro`): talones perforados del día 1 al 30 con igualas, link de datos, cobranza, complemento de pago y paquete para el contador, cada uno con una muestra real de la app.
- Página `/herramientas/calculadora-retenciones-resico` con la calculadora, tabla de ejemplos, "Cómo se calcula" (LISR 113-J, RLIVA 3) y preguntas con FAQPage. Los cálculos salen de `src/utils/retenciones.ts`, que también usa la calculadora.
- Textos: hero, comparación, seguridad ("Corregir factura" y cancelar sin timbres, revisado en el código) y cuatro preguntas nuevas (igualas, complemento, contador, extranjero). Navegación en el orden de la página y pie con "Herramientas".
- Verificación: `npm run build` (4 páginas); capturas a 375 y 1280 px en claro y oscuro, sin desbordes ni errores de consola.

### 2026-10-25 — brief de diseño de la landing

- Doc "Brief de diseño: landing de FacturaFast" en Claude Docs (https://claude.ai/artifact/AVXjgQ7NUoEXHhDt6bwUWb), con el prompt para un diseñador y la revisión de 9 competidores (capturas a 1440 y 390 px).
- Hallazgos: todos usan fondo blanco, una sans tipo Inter y un acento azul, morado o verde, con un panel de la app en el hero; nadie muestra la factura ni el neto a recibir. SenHub (profesionistas RESICO, $79 al mes más IVA) tiene un titular casi igual al nuestro: se propone «Factura tus honorarios con las retenciones correctas.».
- Dirección propuesta: subir el volumen del Talonario (factura grande, una sola animación del sello, impresión de seguridad, precios como pliego de timbres, un campo de color). Falta definir plazo y presupuesto con el diseñador.

### 2026-10-26 — quejas de quien factura: sección en la landing y features 15 y 16

- **Landing** (`facturafast-landing`, rama `feat/landing-mejoras`, sin commit): sección «Los problemas de siempre al facturar» (`src/components/Complaints.astro`), después del hero.
  - Son 9 quejas con su solución; solo entra lo que la app ya hace.
  - Va en una hoja rayada con doble raya roja.
- **App:**
  - feature 15, aviso de CSD por vencer: en Inicio, en Perfiles fiscales, por correo desde el cron y al timbrar;
  - feature 16, errores del SAT en palabras simples, con un botón que lleva a corregirlos.
- **Verificado:** `npx tsc --noEmit` y `pnpm lint` sin errores nuevos; pruebas en el scratchpad (`csd/`); pantallas a 375 y 1280 px con sesión de prueba; un timbrado en el sandbox, que respondió S2000.
- **Sigue:** revisar desde México el link del trámite del SAT. El correo de prueba del aviso de CSD se envió con permiso del usuario.

