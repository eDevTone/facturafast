# Link para que el cliente capture sus datos

**Fecha:** 2026-10-22
**Estado:** aprobado y programado el 2026-10-22.
**Plan:** feature 14 de `PLAN-FEATURES.md`

## Objetivo

Le mandas a tu cliente un link y él mismo llena sus datos fiscales: RFC, razón social, régimen, código postal, uso CFDI y correo. Si sube su constancia, se llenan solos. Al terminar, el cliente queda guardado y te avisamos.

## Alcance

**Entra:**

- pedir datos a un cliente nuevo o pedirle a uno existente que los actualice;
- la página pública del link;
- el aviso al usuario cuando el cliente termina.

**Fuera:**

- clientes del extranjero: la página dice "Si tu empresa está fuera de México, escríbele a <negocio>";
- recordarle al cliente que no ha llenado sus datos.

## Reglas confirmadas

- **La constancia es opcional:** el SAT aclaró que no es requisito para facturar y que condicionar la factura a ella se multa (comunicado 04/2026, ya en Fuentes). La página lo trata como un atajo, no como requisito.
- **Régimen y uso CFDI se filtran por el tipo de persona del RFC,** como en el formulario de clientes. El servidor también valida el régimen (`assertTaxRegimeFitsRfc`, del arreglo del 2026-10-22).

## Modelo de datos (migración 0017)

| Tabla | Columna | Tipo | Uso |
|---|---|---|---|
| `client_data_requests` | `id`, `user_id`, `issuing_profile_id` | uuid | De quién es y con qué nombre de negocio se presenta. |
| | `client_id` | uuid, nulo | Nulo: cliente nuevo. Con valor: actualizar ese cliente. |
| | `label` | varchar(120) | Cómo lo identificas: "Kemper". |
| | `token_hash` | varchar(64), único | SHA-256 del token. |
| | `status` | enum `client_request_status` (`pendiente`, `completada`, `cancelada`) | |
| | `expires_at` | timestamp | 30 días después de crearse. |
| | `created_at`, `completed_at` | timestamp | |

## Flujo

1. **Pedir datos:**
   - en Clientes, "Pedir datos a un cliente", con el nombre para identificarlo;
   - en el menú de un cliente existente, "Pedirle que actualice sus datos".
   - El diálogo muestra el link con "Copiar", "Mandar por WhatsApp" y "Mandar por correo", este último solo si ya tienes su correo.
     - **WhatsApp** usa `wa.me`, como en la cobranza.
     - **Correo** abre tu propio programa de correo (`mailto:`), así el mensaje sale de ti.
   - El mensaje sugerido: "Hola, para hacerte tu factura necesito tus datos fiscales. Puedes llenarlos aquí: <link>".
2. **Pendientes:** en Clientes, una franja "Esperando datos de: Kemper (link del 22 oct)", con "Copiar link" y "Cancelar".
3. **Página pública** (`/datos/<token>`, fuera de Clerk, `noindex`, pensada primero para el celular):
   - "KARLA PÉREZ te pide tus datos fiscales para hacerte tu factura." Solo se muestra el nombre del negocio, ningún otro dato tuyo;
   - "¿Tienes tu constancia a la mano? Súbela y llenamos los datos por ti (opcional)";
   - el formulario: RFC, nombre o razón social, régimen, código postal, uso CFDI (G03 por omisión), correo para recibir las facturas y teléfono opcional;
   - si el link es para actualizar, el formulario no muestra los datos que ya tienes; se llena desde cero. Así el link no revela nada si alguien más lo abre.
4. **Al enviar:**
   - con el mismo esquema y servicio que el formulario de clientes, se crea el cliente o se actualiza el del link;
   - si es un cliente nuevo y su RFC ya existe en tu cuenta, se actualiza ese cliente en lugar de duplicarlo;
   - el link queda completado y te llega un correo: "ESCUELA KEMPER URGATE llenó sus datos", con un enlace al cliente;
   - la página dice "Listo, ya puede facturarte".
5. **Link vencido, cancelado o ya usado:** la página dice que ya no funciona y que le pida uno nuevo a quien se lo mandó.

## Decisiones

- **Un link por solicitud, de un solo uso y con vencimiento de 30 días.** El token tiene 32 bytes al azar y solo se guarda su hash.
- **Constancia en la página pública:** una server action propia que exige un token pendiente, con el mismo límite de 10 MB y solo PDF.
  - De paso: `extractCsfAction` hoy no pide sesión, así que cualquiera puede llamarla. Se le agrega la revisión de `auth()`.
- **Quién se presenta:** el nombre del perfil fiscal predeterminado o el que eliges al crear el link si tienes varios.

## Casos de prueba

- **Token:**
  - válido y vencido;
  - completado, cancelado e inventado, los tres con la misma respuesta.
- **Cliente nuevo, cliente existente y RFC repetido:** se actualiza el que ya existe, sin duplicar.
- **Régimen que no corresponde al RFC:** se rechaza con mensaje claro, en la página y en el servidor.
- **Constancia:** llena los campos, y no funciona con un token inválido.
- **Interfaz:** la página a 375 px sin sesión, en claro y oscuro; el diálogo y la franja de pendientes en Clientes.
