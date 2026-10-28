# Clientes del extranjero en dólares

**Fecha:** 2026-10-19
**Estado:** aprobado el 2026-10-20 y programado. Faltan el timbrado en el sandbox (4.8) y la prueba con el token de Banxico (4.4).
**Plan:** feature 4 de `PLAN-FEATURES.md`

## Objetivo

- **Cliente "en el extranjero":** sin RFC mexicano. Se registra con su país y su número de identificación fiscal; la app pone el RFC genérico `XEXX010101000` y lo demás que pide el SAT.
- **Factura en dólares:** el tipo de cambio del DOF se pone solo y se puede editar.
- **IVA:** 0 % cuando el servicio se exporta, con la explicación de cuándo aplica, o 16 %. Sin retenciones.
- **El Inicio suma en pesos.**
- **El complemento de pago en dólares**, que el plan dejó para este feature.

## Alcance

**Entra:**
- Clientes del extranjero, con su país (c_Pais) y su número de identificación fiscal.
- Facturas en pesos o en dólares, a cualquier cliente. La moneda por defecto es USD para un cliente del extranjero y MXN para los demás.
- Tipo de cambio automático (API SIE de Banxico) y editable; sin token de Banxico, se escribe a mano.
- IVA 0 % o 16 % por factura, con la elección guardada en el cliente.
- XML, PDF, detalle, lista y correo con la moneda y el tipo de cambio.
- Totales del Inicio en pesos.
- Complemento de pago en dólares, cuando la factura es en dólares y el cobro llega en dólares.

**No entra:**
- Euros y otras monedas. El CFF (art. 20) las convierte con una tabla que Banxico publica cada mes, ya pasado el mes. Ver "Vigilar" en el plan.
- Un cobro en pesos de una factura en dólares (`EquivalenciaDR` distinta de 1).
- El Complemento de Comercio Exterior, que es solo para mercancías.
- Notas de crédito a clientes del extranjero (feature 10).

## Reglas confirmadas

Investigadas el 2026-10-19 con:
- la guía de llenado del Anexo 20 (rev. 3, 16 de enero de 2026), el estándar y la matriz de errores CFDI 4.0 (25 de marzo de 2026);
- el catálogo `catCFDI_V_4_20261015.xls`;
- la LIVA, el RLIVA, el CFF y la RMF 2026;
- la guía de pagos rev. 4 y la API de Banxico.

**Receptor del extranjero**
- **RFC:** `XEXX010101000`. El SAT no valida el nombre (RMF 2026, regla 2.7.1.23; estándar, p. 74).
- **Domicilio fiscal:** `DomicilioFiscalReceptor` debe ser igual al `LugarExpedicion` del emisor (CFDI40149).
- **Régimen:** `RegimenFiscalReceptor="616"` (CFDI40159).
- **Uso CFDI:** `S01` "Sin efectos fiscales" (guía, p. 20). El catálogo solo permite G02, S01 y CP01 con el régimen 616 (CFDI40161). El complemento de pago lleva CP01.
- **Residencia fiscal:** `ResidenciaFiscal` es un país de c_Pais, distinto de MEX (CFDI40150, CFDI40152).
  - Es obligatoria si hay `NumRegIdTrib` (CFDI40153). La guía de pagos la pide siempre para XEXX, así que la app siempre la manda.
- **Número fiscal:** `NumRegIdTrib` es opcional sin Comercio Exterior.
  - Debe cumplir el patrón de c_Pais (CFDI40156): EE. UU. y Canadá, 9 dígitos (un EIN se escribe sin guion); los demás países no tienen patrón.
  - **Riesgo:** el texto de CFDI40155 parece pedir el Complemento de Comercio Exterior para usarlo. Se prueba en el sandbox.
- **Exportación:** `Exportacion="01"` (No aplica). Los valores 02 a 04 son de pedimentos de mercancías, y el 02 exige el Complemento de Comercio Exterior (guía, p. 11; CFDI40122 y CFDI40222).

**IVA 0 %** (LIVA art. 29; RLIVA arts. 58 y 61)
- **Fracción IV:** lista los servicios que se exportan a 0 %:
  - asistencia técnica;
  - publicidad;
  - servicios de tecnologías de la información (desarrollo y mantenimiento de aplicaciones, hosting y otros). Estos piden que el CFDI lleve el número fiscal del cliente.
- **Último párrafo:** aplica el 0 % a los "servicios personales independientes que sean aprovechados en su totalidad en el extranjero por residentes en el extranjero sin establecimiento en el país". Esto cubre a un freelancer.
- **Condición de pago:** el cliente lo contrata y lo paga desde el extranjero, "mediante cheque nominativo o transferencia de fondos… y el pago provenga de cuentas de instituciones financieras ubicadas en el extranjero" (RLIVA art. 58, segundo párrafo, aplicado por el art. 61). No menciona tarjeta, PayPal ni plataformas.
- **Si no se cumple,** el IVA es 16 %.
- **En el XML:** `ObjetoImp="02"` y un traslado 002 con `TasaOCuota="0.000000"` e `Importe="0.00"` (CFDI40171 y CFDI40178).

**Retenciones:** un cliente del extranjero no retiene ISR ni IVA. La retención de RESICO (LISR art. 113-J) la hace una persona moral mexicana. La matriz no rechaza retenciones con XEXX, así que lo impide la app.

**Moneda y tipo de cambio**
- **Cuándo va:** `TipoCambio` es obligatorio si `Moneda` no es MXN (CFDI40115). Lleva hasta 6 decimales (CFDI40117).
- **Rango:** con el 500 % de variación del catálogo, solo pide un código de confirmación en casos absurdos (CFDI40118).
- **Decimales:** los importes en USD llevan 2.
- **Qué tipo de cambio:**
  - la guía solo dice "FIX" (p. 9);
  - el CFF (art. 20, tercer párrafo) pide el que Banxico publica en el DOF el día anterior, o el último publicado;
  - para un día D, ese valor es la serie **SF60653** de Banxico ("para solventar obligaciones"), no la SF43718 (la FIX por fecha de determinación). Se comprobó contra los 292 días de 2026: el 19 de octubre es 18.4250;
  - el mismo artículo da preferencia al tipo de cambio al que se adquirieron los dólares, así que el campo se puede editar.
- **API SIE de Banxico:**
  - el token es gratuito y se pide en un formulario con captcha;
  - va en el encabezado `Bmx-Token`;
  - límites: 200 consultas de rangos cada 5 minutos;
  - los días sin dato vienen como `N/E`;
  - SF60653 ya trae valores dos días adelante, así que se pide el rango D..D y no el "oportuno".

**Complemento de pago en dólares** (guía de pagos, pp. 21 a 40)
- **Moneda del pago:** `MonedaP="USD"`.
- **Tipo de cambio:** `TipoCambioP` es el "de la moneda a la fecha en que se recibió el pago" (CRP20214).
- **Equivalencia:** `EquivalenciaDR="1"` (CRP20238).
- **Montos:** los saldos y montos van en USD.
- **Totales:** `pago20:Totales` va en pesos: cada total es round(Σ valor × `TipoCambioP`, 2), y se redondea al final (CRP20211).
- **Ejemplo del SAT con error:** el de la p. 77 (348,000.00 donde la fórmula da 348,000.03). Se programa la fórmula, no el ejemplo.
- **IVA 0 %:** `TotalTrasladosBaseIVA0` = round(Σ `BaseP` × TC, 2) y `TotalTrasladosImpuestoIVA0="0.00"`.

## Modelo de datos

La migración `0013_foreign_clients.sql` agrega tres tablas y cambia otras tres. El único cambio a una columna existente quita el `NOT NULL` del código postal de los clientes.

```ts
// database/schemas/sat-catalogs.schema.ts
// c_Pais: los 250 países del catálogo oficial
export const countries = pgTable('countries', {
  code: varchar('code', { length: 3 }).primaryKey(),
  description: text('description').notNull(),
  /** "Formato de Registro de Identidad Tributaria": regex de NumRegIdTrib, si existe. */
  taxIdFormat: text('tax_id_format'),
})
// c_Moneda: las 183 monedas, con sus decimales
export const currencies = pgTable('currencies', {
  code: varchar('code', { length: 3 }).primaryKey(),
  description: text('description').notNull(),
  decimals: integer('decimals').notNull(),
})

// database/schemas/exchange-rates.schema.ts
/** Caché de la serie SF60653 de Banxico: el tipo de cambio del CFF art. 20 para cada día. */
export const exchangeRates = pgTable('exchange_rates', {
  currency: varchar('currency', { length: 3 }).notNull(),
  day: date('day', { mode: 'string' }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.currency, table.day] })])

// clients
country: varchar('country', { length: 3 }),             // c_Pais; null = México
foreignTaxId: varchar('foreign_tax_id', { length: 40 }), // NumRegIdTrib
ivaRate: numeric('iva_rate', { precision: 8, scale: 6 }), // el IVA que se le cobra (0 o 0.16); se propone al facturar
postalCode: varchar('postal_code', { length: 5 }),       // ahora acepta nulos: un cliente del extranjero no tiene CP mexicano

// invoices
exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),   // TipoCambio; null en pesos
exchangeRateSource: varchar('exchange_rate_source', { length: 10 }),   // 'dof' o 'manual'
ivaRate: numeric('iva_rate', { precision: 8, scale: 6 }).notNull().default('0.16'),

// payments (currency ya existe)
exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }),   // TipoCambioP
```

- **Cliente del extranjero:** es el que tiene `rfc = 'XEXX010101000'`, siempre con `country`, `taxRegime = '616'` y `cfdiUsage = 'S01'`.
- **RFC repetido:** el aviso se salta con los RFC genéricos. Con `XEXX010101000`, se revisa que no se repitan el país y el número fiscal.
- **Catálogos:** se cargan con el seed desde el `catCFDI` oficial, que se convierte una vez con un script. Así c_Pais trae los patrones de `NumRegIdTrib`.

## Tipo de cambio

- **Módulo:** `features/exchange-rates/` con `getDofRate(currency, day)`.
  - Lee la caché.
  - Si no tiene el día, pide a Banxico los últimos 10 días hasta D (serie SF60653) y los guarda.
  - Sin `BANXICO_TOKEN`, o si Banxico no contesta, devuelve null y la interfaz pide el tipo de cambio a mano.
- **Factura:**
  - el borrador muestra el tipo de cambio de hoy, con su origen: "18.4250 · DOF, para el 19 de octubre";
  - si el usuario lo cambia, queda `manual`;
  - al timbrar, si es `dof`, se vuelve a pedir el del día de timbrado (la `Fecha` del CFDI). Si no se consigue, no se timbra y se pide escribirlo;
  - si es `manual`, se respeta.
- **Complemento de pago:** el tipo de cambio es el de `paid_on`, también editable.

## Clientes

- **Formulario:** arriba, el interruptor "Cliente en el extranjero". Al activarlo:
  - se ocultan el RFC, el código postal, el régimen, el uso CFDI y la constancia;
  - aparecen el país (con buscador; sin México), el número de identificación fiscal y "¿Le cobras IVA?".
- **Número fiscal:** opcional, aunque se recomienda porque el 0 % de servicios de TI lo pide. Se valida con el patrón del país y se le quitan los guiones.
- **"¿Le cobras IVA?":** obligatorio para un cliente del extranjero.
  - "0 % por exportación de servicios": muestra las condiciones (sin establecimiento en México, aprovecha el servicio fuera y paga por transferencia o cheque desde una cuenta del extranjero) y avisa que con PayPal, Wise o tarjeta conviene revisarlo con el contador.
  - "16 %".
  - La app no elige por el usuario: la elección se hace una vez por cliente y se puede cambiar en cada factura.
- **Lista:** "En el extranjero · Estados Unidos" en lugar de "Persona física", y el número fiscal en lugar del RFC.

## Factura

- **Cliente del extranjero:**
  - moneda USD por defecto (se puede cambiar a MXN);
  - campo de tipo de cambio;
  - IVA tomado del cliente;
  - uso CFDI fijo en S01;
  - las retenciones se ocultan con la nota "Un cliente del extranjero no te retiene impuestos".
- **Cliente mexicano:** puede facturarse en USD con el mismo selector. Todo lo demás queda igual.
- **Montos:**
  - `computeCfdiAmounts` recibe `ivaRate` (hoy usa el 16 % fijo), y con 0 % el precio "con IVA" es el mismo;
  - todo se calcula en la moneda de la factura;
  - `formatCurrency(amount, currency)` muestra "USD 1,000.00".
- **XML** (`buildCfdiXml`):
  - en el comprobante, `Moneda` y `TipoCambio`;
  - en el receptor, `DomicilioFiscalReceptor` con el CP del emisor, `ResidenciaFiscal`, `NumRegIdTrib` (si lo hay), 616 y S01;
  - el IVA con la tasa de la factura y `Exportacion="01"`.
  - La cadena original ya contempla `ResidenciaFiscal` y `NumRegIdTrib`.
- **PDF, detalle, diálogo de timbrar y correo:**
  - la moneda en cada importe;
  - el renglón "Tipo de cambio 18.4250";
  - el IVA como "IVA 0 %" o "IVA 16 %";
  - en el receptor, el país y el número fiscal en lugar del CP.
- **Servidor:** rechaza retenciones para `XEXX010101000` y un tipo de cambio vacío en una factura que no es en pesos.

## Inicio

Los totales del mes se convierten a pesos con el tipo de cambio de cada factura (`sum(total * coalesce(exchange_rate, 1))`). El feature 7 ("Tu mes") hará lo mismo.

## Complemento de pago en dólares

- **El cobro sigue la moneda de la factura:** el diálogo "Registrar cobro" muestra los montos en USD y el tipo de cambio de la fecha de pago, editable.
- **XML:**
  - `MonedaP="USD"`, `TipoCambioP` y `EquivalenciaDR="1"`;
  - `ImpuestosDR` con la tasa de la factura;
  - `Totales` en pesos con la fórmula de la guía;
  - el receptor del extranjero con CP01, 616, `ResidenciaFiscal` y CP del emisor.
- **Código:** `computePaymentTotals` recibe el tipo de cambio de cada pago y redondea al final. Se prueba con el ejemplo de la guía y con su error.

## Archivos

- **Nuevos:**
  - la migración `0013`;
  - `database/schemas/exchange-rates.schema.ts`;
  - `database/seeds/data/` con c_Pais y c_Moneda, y el script que los genera del catálogo oficial;
  - `features/exchange-rates/` (servicio de Banxico, caché y acción).
- **Cambian:**
  - los esquemas `sat-catalogs`, `clients`, `invoices` y `payments`;
  - el seed de catálogos y `sat-catalog.service.ts`;
  - clientes: formulario, esquema, servicio y lista;
  - facturas: formulario, esquema, `cfdi-amounts`, `invoice-calculations`, servicio, detalle, fila, PDF y diálogo de timbrar;
  - `cfdi-xml-builder` y `payment-xml-builder`;
  - `payment-amounts`, el diálogo de cobro y el PDF del REP;
  - `dashboard.service.ts`, el correo y `CLAUDE.md` (`BANXICO_TOKEN`).

## Orden de implementación

1. **Catálogos y migración (4.2).** Pido permiso para aplicarla y cargar los catálogos en Neon.
2. **Clientes (4.1).**
3. **Tipo de cambio (4.4).** Necesita el token de Banxico; sin él, la captura a mano funciona igual.
4. **Factura: moneda y tipo de cambio (4.3).**
5. **IVA 0 % y retenciones (4.6).**
6. **XML (4.5).**
7. **Inicio (4.7).**
8. **Complemento de pago en dólares (4.9, nueva).**
9. **Verificación (4.8).** Necesita timbres de prueba en SW.

## Casos de prueba

1. **Unitarios, con scripts en el scratchpad:**
   - montos en USD con IVA 0 % y 16 %, con y sin "precios con IVA";
   - XML y cadena original con `Moneda`, `TipoCambio`, `ResidenciaFiscal` y `NumRegIdTrib`;
   - patrones de `NumRegIdTrib` (USA, CAN y un país sin patrón);
   - el día del tipo de cambio: sábado, día festivo y SF60653 adelantada;
   - `Totales` del REP en pesos: el caso de la guía y el redondeo al final.
2. **Banxico:**
   - respuestas grabadas, incluido `N/E`;
   - con el token, una consulta real comparada con el DOF (19 de octubre: 18.4250).
3. **Sandbox de SW** (cuando haya timbres):
   - factura en USD a un cliente de EE. UU. con IVA 0 % y `NumRegIdTrib`; si el PAC responde CFDI40155, se repite sin él y se decide;
   - otra con IVA 16 %;
   - el REP en USD de una factura PPD.
4. **Interfaz:** alta de un cliente del extranjero, factura en USD, Inicio en pesos. A 375, 768 y 1280 px, en claro y oscuro.

## Fuentes

Las copias están en el scratchpad de la sesión (`research-f4/` y `research-f4b/`).

- [Guía de llenado CFDI 4.0, rev. 3](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Anexo_20_Guia_de_llenado_CFDI.pdf): pp. 9 a 11, 19 y 20.
- [Anexo 20, estándar (DOF del 13 de enero de 2022)](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Anexo20_2022.pdf): pp. 72 a 75.
- [Matriz de errores CFDI 4.0 (25 de marzo de 2026)](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/MatrizDeErrores_CFDI_v40_20260325.xls).
- [Catálogo `catCFDI_V_4_20261015.xls`](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/catCFDI_V_4_20261015.xls): hojas c_Pais y c_Moneda.
- [Guía de llenado del complemento de pagos, rev. 4](http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Guia_llenado_pagos.pdf): pp. 21 a 40 y 77.
- [LIVA](https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf), art. 29; [RLIVA](https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LIVA_250914.pdf), arts. 58 y 61; [CFF](https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf), art. 20; [LISR](https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf), art. 113-J.
- RMF 2026 (DOF del 28 de diciembre de 2025), regla 2.7.1.23.
- [API SIE de Banxico](https://www.banxico.org.mx/SieAPIRest/service/v1/) y su [token](https://www.banxico.org.mx/SieAPIRest/service/v1/token); [tipos de cambio de Banxico](https://www.banxico.org.mx/tipcamb/tipCamMIAction.do?idioma=sp), nota 4.

**Sin fuente oficial:**
- qué día de tipo de cambio va en `TipoCambio`: el SAT no lo dice; se usa el del CFF art. 20;
- `Exportacion="01"` para servicios: el SAT no lo dice expresamente, se deduce de la guía;
- qué servicios de un freelancer califican para el 0 %: es interpretación; la app explica las condiciones y deja la decisión al usuario.
