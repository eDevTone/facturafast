# Notas de crédito

**Fecha:** 2026-10-22
**Estado:** descartado del MVP el 2026-10-22. Se guarda por las reglas confirmadas, por si el feature vuelve.
**Plan:** feature 10 de `PLAN-FEATURES.md`

## Objetivo

Hacer un descuento, una bonificación o un ajuste sobre una factura ya timbrada sin cancelarla. La nota de crédito baja lo que te deben, y el siguiente complemento de pago parte del saldo ya rebajado.

## Alcance

**Entra:**

- crear, timbrar, cancelar y mandar al cliente una nota de crédito de una factura timbrada;
- su efecto en el saldo de la factura, la cobranza, los complementos, el Inicio, el PDF y el paquete del contador.

**Fuera:**

- una nota que abarque varias facturas: una nota, una factura;
- devoluciones de mercancía (TipoRelacion 03) y aplicación de anticipos (07);
- corregir una nota de crédito con sustitución: se cancela y se hace otra.

## Reglas confirmadas

Fuentes:

- **Guía:** Guía de llenado CFDI 4.0 (rev. 16-ene-2026).
- **Guía de pagos:** Guía de llenado del complemento de pagos (16-ene-2026).
- **Matriz:** matriz de errores CFDI 4.0 (25-mar-2026).
- **Anexo 29 y RMF 2026.**

| Campo | Valor | Fuente |
|---|---|---|
| `TipoDeComprobante` | `E` | Guía |
| `CfdiRelacionados` | `TipoRelacion="01"` con el UUID de la factura | Guía, apéndice 5, p. 66. LIVA art. 7 pide identificar la operación original. |
| `MetodoPago` | `PUE` | Guía, pp. 65, 66 y 68. Ninguna validación lo obliga, pero es lo que dice la guía. |
| `FormaPago` | `15` (Condonación) si la factura aún no está pagada del todo. Si ya se cobró: la misma forma que la factura, o la forma en que devuelves el dinero (p. ej., `03`). | Guía, p. 7, apéndice 5 y pregunta 30. Los ejemplos del SAT usan 15 en una PPD con saldo. |
| `ClaveProdServ` / `ClaveUnidad` | `84111506` (Servicios de facturación) / `ACT` (Actividad) | Guía, pp. 65–67: se permite esta o la del concepto original. |
| `UsoCFDI` | `G02` (Devoluciones, descuentos o bonificaciones); `S01` si el cliente es del extranjero | Catálogo, que exige CFDI40161. G02 aplica a personas físicas y morales. |
| `Exportacion` | `01` | Guía, p. 11 |
| IVA | Traslado de la misma tasa sobre la base del descuento, `ObjetoImp` 02 | LIVA art. 7: el IVA restituido va por separado. |
| Moneda | La de la factura, con el tipo de cambio del DOF del día de la nota | No hay regla del SAT. Se sigue el CFF art. 20; con cualquiera de los dos timbra. |

- **Retenciones (inferencia, no regla del SAT):** la nota lleva las mismas tasas de la factura, en proporción (ISR 1.25 %, IVA 10.6667 %).
  - Ambas retenciones se calculan sobre lo efectivamente pagado (LISR 113-J, LIVA 1-A).
  - Sin ellas no cuadran el total, el saldo y las retenciones del complemento.
  - El PAC no las exige ni las rechaza (Anexo 29 solo valida RESICO en tipo I).
  - **Pendiente:** confirmarlo con un contador. Queda en "Vigilar".
- **Límite:** nada en el SAT ata el total de la nota al de la factura. La app no deja que las notas vigentes sumen más que el saldo de la factura: en PPD, el saldo por cobrar; en PUE, el total.
- **Complementos de pago después de una nota:**
  - la nota no es una parcialidad, y el siguiente complemento parte del saldo ya rebajado;
  - ejemplos del SAT: factura de 406,000 y nota de 58,000, y el primer complemento lleva parcialidad 1 con saldo anterior de 348,000 (Guía de pagos, pp. 76–77; Guía, apéndice 9, pp. 102–104);
  - no se emite un complemento para aplicar la nota (Guía de pagos, nota 4, p. 55).
- **Cancelación:**
  - no se puede cancelar una factura que tiene una nota vigente relacionada; primero se cancela la nota (RMF 2.7.1.34);
  - la nota se cancela sin aceptación del cliente (RMF 2.7.1.35, fr. III).

## Modelo de datos (migración 0018)

| Tabla | Columna | Tipo | Uso |
|---|---|---|---|
| `invoices` | `cfdi_type` | varchar(1), `'I'` | `I` factura, `E` nota de crédito. |

- **Relación:** la nota reutiliza `relation_type` (`'01'`) y `related_uuid` (UUID de la factura).
- **Serie:** `NC` por omisión, con su propia numeración por perfil, como ya hace `getNextFolio`.

## Flujo

1. **Crear** (detalle de una factura timbrada y vigente → "Nota de crédito"). Un diálogo pide:
   - descripción, por omisión "Descuento sobre la factura A-12";
   - monto antes de IVA, o un porcentaje del subtotal;
   - forma de pago: 15 si queda saldo, la de la factura si ya se cobró. Se puede cambiar, sin 99.

   El diálogo muestra en vivo IVA, retenciones, total y el saldo que quedaría. "Guardar borrador" crea el borrador tipo E.
2. **Timbrar:** desde el detalle del borrador, como una factura. `stampInvoice` arma el XML tipo E y se le manda al cliente con su PDF.
3. **Efectos:**
   - **saldo de la factura:** total menos complementos menos notas vigentes. Afecta la cobranza, "Te deben" y "Registrar cobro";
   - **siguiente complemento:** saldo anterior ya rebajado y parcialidad sin contar la nota;
   - **Inicio:** "Facturado" del mes resta las notas timbradas en el mes;
   - **lista de facturas:** la nota sale como "Nota de crédito NC-1", con el monto en negativo;
   - **PDF:** título "Nota de crédito" y "Relacionada con A-12 (01 — Nota de crédito de los documentos relacionados)".
4. **Cancelar:**
   - la nota se cancela como una factura, sin esperar aceptación;
   - la factura con notas vigentes no se puede cancelar ni corregir: "Primero cancela la nota de crédito NC-1".
5. **Paquete del contador:** carpeta `notas-de-credito/`.

## Ajustes a lo que ya existe

Hoy la app supone que toda factura con `related_uuid` es una sustitución (04). Con las notas eso deja de ser cierto:

- `createCorrectionDraft` busca el borrador de corrección por `related_uuid` y tomaría el borrador de una nota. Se filtra por `relation_type = '04'`.
- `getInvoiceRelations` mostraría la nota como "sustituye a". Se separan "Sustituye a" y "Nota de crédito de".
- El PDF escribe el código `01` sin nombre. Se agrega la etiqueta.

## Casos de prueba

- **XML tipo E:**
  - `TipoDeComprobante`, `MetodoPago` PUE, `FormaPago` 15 en una PPD con saldo, relación 01;
  - conceptos 84111506/ACT, uso G02 y S01 en un cliente del extranjero;
  - IVA y retenciones proporcionales, y totales iguales al cálculo del formulario;
  - la cadena original y el sello con el CSD de prueba. Sin timbres de SW no se puede timbrar.
- **Saldos:**
  - una factura PPD de 10,408.33 con una nota de 1,040.83 queda en 9,367.50;
  - el siguiente complemento lleva parcialidad 1 y saldo anterior de 9,367.50;
  - con una nota de más del saldo, se rechaza.
- **Guardas:** cancelar y corregir una factura con nota vigente se bloquea, y el borrador de la nota no se confunde con un borrador de corrección.
- **Inicio:** el mes con una nota resta su subtotal.
- **Interfaz a 375, 768 y 1280 px:** el diálogo, el detalle de la nota y la marca en la lista.

## Lo que no se puede probar sin timbres de SW

El timbrado real, el PDF y el correo de una nota timbrada.
