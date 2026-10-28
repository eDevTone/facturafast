# Paquete para tu contador

**Fecha:** 2026-10-22
**Estado:** aprobado y programado el 2026-10-22. Cambio al programarlo: el token también se guarda cifrado, para poder copiar el link otra vez.
**Plan:** feature 8 de `PLAN-FEATURES.md`

## Objetivo

- **"Descargar mes"** baja un ZIP con los XML y PDF del mes y un resumen en CSV.
- **"Link para tu contador":** un link privado con el que tu contador baja lo mismo, sin entrar a tu cuenta. Se puede cancelar cuando quieras.

## Alcance

**Entra:** 8.1 a 8.4.

**Fuera:**

- Excel (`.xlsx`): el CSV se abre en Excel y no pide otra dependencia;
- una cuenta de contador que reúna a varios clientes: se puede construir encima del link;
- mandar el paquete al contador cada mes por correo: es fácil con el cron del feature 6, pero va después.

## Qué trae el paquete de un mes

- **Qué documentos:** los CFDI de un perfil fiscal (un RFC) timbrados en el mes, por la fecha de timbrado en Ciudad de México.
  - facturas;
  - notas de crédito, cuando exista el feature 10;
  - complementos de pago;
  - también los cancelados: el contador necesita verlos, y el resumen dice que están cancelados.
- **Estructura del ZIP:**

  ```
  KAPV900101AB1-2026-10.zip
    resumen-2026-10.csv
    facturas/A-12_EKU9003173C9.xml y .pdf
    complementos/P-3_EKU9003173C9.xml y .pdf
    notas-de-credito/NC-1_EKU9003173C9.xml y .pdf
    cancelaciones/A-9_EKU9003173C9_acuse.xml
  ```

  Los nombres van sin acentos (folio y RFC del cliente) para que abran igual en cualquier sistema.
- **De dónde salen los archivos:**
  - el XML, de R2 o de `xml_content`;
  - el PDF, de R2, o se genera si no está guardado.
- **Resumen CSV,** en UTF-8 con BOM para que Excel respete los acentos. Una fila por CFDI, con estas columnas:
  - tipo, serie y folio, fecha de timbrado y UUID;
  - RFC y nombre del cliente;
  - subtotal, IVA trasladado, ISR retenido, IVA retenido y total;
  - moneda, tipo de cambio y total en pesos;
  - método y forma de pago;
  - estatus (vigente o cancelada) y cobro: cobrado y saldo, de la cobranza del feature 5;
  - UUID relacionado: el de la factura que paga un complemento o que sustituye una corrección.

## Modelo de datos (migración 0016)

| Tabla | Columna | Tipo | Uso |
|---|---|---|---|
| `accountant_links` | `id`, `user_id`, `issuing_profile_id` | uuid | Un link por RFC emisor. |
| | `token_hash` | varchar(64), único | SHA-256 del token. El token solo existe en el link. |
| | `created_at`, `last_used_at`, `revoked_at` | timestamp | Cuándo se creó, cuándo lo usó el contador y si se canceló. |

## Flujo

1. **Descargar** (Facturas → "Para tu contador"):
   - eliges el mes (los últimos 12) y, si tienes varios RFC, el perfil;
   - una server action arma el ZIP, lo sube a R2 en `exports/<usuario>/<perfil>/<mes>.zip` (se reemplaza en cada descarga) y devuelve una URL firmada de 10 minutos. Es como ya bajan el XML y el PDF;
   - el mes en curso se puede bajar, con la nota "El mes no ha terminado".
2. **Link para tu contador** (en el mismo diálogo):
   - "Crear link" genera el token (32 bytes al azar) y muestra el link `/contador/<token>` con botones para copiarlo y mandarlo por WhatsApp;
   - "Crear uno nuevo" cancela el anterior, y "Cancelar link" lo apaga;
   - el diálogo dice cuándo lo usó el contador por última vez.
3. **Página del contador** (`/contador/<token>`, fuera de Clerk, `noindex`):
   - nombre y RFC de tu negocio, y la lista de meses desde la primera factura timbrada, cada uno con "Descargar ZIP" y "Resumen CSV";
   - la descarga es una server action que valida el token en cada llamada;
   - un token cancelado o que no existe muestra "Este link ya no funciona; pídele uno nuevo a tu cliente". No dice si existió.

## Decisiones

- **Dependencia:** `fflate` (MIT, sin dependencias, unos 30 KB) para el ZIP. `jszip` es más grande y lento, y `archiver` trae varias dependencias.
- **Link en lugar de cuenta de contador:**
  - el contador no necesita registrarse, y el link se cancela en un clic;
  - el riesgo es que quien tenga el link puede bajar los XML, igual que con una carpeta compartida de Drive. Por eso el token es largo, solo se guarda su hash, se ve el último uso y se cancela fácil.
- **ZIP en R2 con URL firmada, no una ruta de API:** sigue la convención del repo, que solo usa rutas de API para webhooks y cron. Además, una ruta que termine en `.zip` se salta el middleware de Clerk.

## Casos de prueba

- **CSV:**
  - importes de facturas en pesos y en dólares, con y sin retenciones;
  - comas y comillas en los nombres;
  - el BOM al principio;
  - una cancelada y un complemento.
- **Límites del mes:** una factura timbrada el 31 a las 23:30 de Ciudad de México cae en ese mes, aunque en UTC ya sea día 1.
- **ZIP:** la lista de archivos, que los XML sean idénticos a los timbrados y que los PDF abran.
- **Link:**
  - válido;
  - cancelado y uno inventado, los dos con la misma respuesta;
  - otro usuario no puede usar el token de un perfil ajeno;
  - la página funciona en una ventana sin sesión.
- **Interfaz a 375, 768 y 1280 px:** el diálogo y la página del contador.
