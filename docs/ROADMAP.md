# FacturaFast — Roadmap de Implementación

> Última actualización: 2026-03-26

---

## Estado General

| Fase | Estado |
|------|--------|
| Onboarding / Certificados SAT | Completado |
| Perfil del Emisor | Completado |
| Integración PAC (sandbox) | Pendiente |
| Catálogos SAT | Completado |
| Timbrado real | Pendiente |
| Lista de facturas | Parcial |
| Descarga XML/PDF | Parcial |
| Cancelación CFDI | Pendiente |
| Dashboard métricas | Completado |
| Gestión de Productos/Servicios | Pendiente |
| Multi-RFC / Multi-empresa | Completado |

---

## Semana 1

### 1. Onboarding / Carga de Certificados SAT — COMPLETADO

**Prioridad:** Critica — sin esto no se puede timbrar.

El usuario sube:

- `.cer` (certificado público)
- `.key` (llave privada)
- Contraseña del certificado

**Requisitos técnicos:**

- Guardar encriptados en DB (nunca texto plano)
- Usar `node-forge` o `crypto` para procesar los archivos
- Validar que el `.cer` y `.key` coincidan (misma pareja)
- Extraer RFC, vigencia y número de serie del certificado
- Mostrar estado del certificado (vigente/expirado)

**Tareas:**

- [x] UI para subir archivos `.cer`, `.key` y contraseña (con toggle de visibilidad)
- [x] Endpoint API para recibir y validar certificados
- [x] Encriptar y almacenar en DB (AES-256-GCM)
- [ ] Validar que `.cer` y `.key` sean pareja (TODO: validar con PAC al timbrar)
- [x] Extraer metadata (RFC, vigencia, número de serie) con node-forge
- [x] Mostrar estado del certificado en el dashboard (badges: CSD listo / Sin CSD / Vencido)
- [x] Upload de Constancia de Situación Fiscal (CSF) para prellenar datos

---

### 2. Perfil del Emisor — COMPLETADO

**Prioridad:** Critica — estos datos van en cada CFDI.

Campos requeridos:

- RFC
- Razón social
- Régimen fiscal (del catálogo SAT)
- Código postal del domicilio fiscal

**Tareas:**

- [x] Modelo/tabla para datos del emisor (`issuing_profiles`)
- [x] Formulario de perfil del emisor con validación Zod
- [x] Validar RFC (formato y estructura)
- [x] Selector de régimen fiscal (catálogo SAT desde DB)
- [x] Asociar perfil emisor al usuario (Clerk userId)
- [x] Soporte Multi-RFC: múltiples perfiles por usuario con perfil predeterminado
- [x] CRUD completo: crear, editar, eliminar, marcar predeterminado
- [x] Link en sidebar (desktop + mobile) bajo sección "Configuración"
- [x] Selector de perfil emisor en formulario de factura (auto-selecciona si solo hay uno)

---

### 3. Catálogos del SAT — COMPLETADO

**Prioridad:** Importante — sin ellos el CFDI no es válido.

Catálogos necesarios:

| Catálogo | Descripción | Registros |
|----------|-------------|-----------|
| `c_UsoCFDI` | Uso de la factura | 24 |
| `c_FormaPago` | Efectivo, transferencia, etc. | 22 |
| `c_MetodoPago` | PUE / PPD | 2 |
| `c_RegimenFiscal` | Régimen fiscal del emisor/receptor | 20 |
| `c_ClaveUnidad` | H87, E48, etc. | 25 |
| `c_ClaveProdServ` | Clave del producto/servicio | 23 |

**Tareas:**

- [x] Crear tablas en DB para cada catálogo (`sat-catalogs.schema.ts`)
- [x] Script de seed para poblar catálogos (`sat-catalogs.seed.ts`)
- [x] Servicio centralizado para consultar catálogos (`sat-catalog.service.ts`)
- [x] Todos los selects e inputs usan datos de DB (no hardcodeados)
- [x] Labels dinámicos en vistas de detalle y PDF
- [x] Select con scroll limitado a 300px (fix overflow)

---

### 4. Integración PAC (sandbox)

**Prioridad:** Critica — el PAC es quien timbra.

PACs recomendados:

| PAC | Ventaja | Costo aprox. |
|-----|---------|-------------|
| **SW SapienWare** | API REST limpia, sandbox gratis, mejor DX | ~$1.10 MXN/timbre |
| Finkok | Muy usado, buena documentación | Variable |
| FiscoClic | Más barato en volumen | Variable |

**Flow de timbrado:**

```
Generar XML CFDI → Enviar al PAC → PAC regresa XML timbrado con UUID
```

**Tareas:**

- [ ] Elegir PAC (decisión pendiente)
- [ ] Crear cuenta sandbox en el PAC elegido
- [ ] Implementar cliente API del PAC
- [ ] Generar XML CFDI válido (CFDI 4.0)
- [ ] Enviar XML al PAC y recibir respuesta timbrada
- [ ] Parsear y almacenar UUID + XML timbrado
- [ ] Manejo de errores del PAC
- [ ] Validar pareja .cer/.key al momento de timbrar (bypass actual)

---

## Semana 2

### 5. Timbrado Real Funcional

**Prioridad:** Critica

- [ ] Pasar de sandbox a producción con el PAC
- [ ] Validar todo el flujo end-to-end con certificados reales
- [ ] Manejo de errores y reintentos
- [ ] Logging de cada timbrado (auditoría)

---

### 6. Lista de Facturas Emitidas — PARCIAL

**Prioridad:** Importante

Campos a mostrar:

- UUID
- Folio
- Cliente (receptor)
- Monto total
- Fecha de emisión
- Estado (vigente / cancelada)

**Tareas:**

- [x] Vista de lista/tabla de facturas (invoice-list existente)
- [ ] Filtros: por fecha, cliente, estado, monto
- [ ] Búsqueda por UUID, folio o cliente
- [ ] Paginación
- [ ] Ordenamiento por columnas

---

### 7. Descarga de XML y PDF — PARCIAL

**Prioridad:** Importante

- [ ] Descarga del XML timbrado
- [x] Generación de PDF (representación impresa con `@react-pdf/renderer`)
- [x] Vista previa de PDF en dialog
- [ ] Incluir en el PDF: QR, cadena original, sello (requiere timbrado)
- [ ] Opción de descargar ambos (XML + PDF) como ZIP

---

### 8. Cancelación de CFDI

**Prioridad:** Importante

- [ ] Endpoint para cancelar factura vía PAC
- [ ] Motivo de cancelación (catálogo SAT: 01, 02, 03, 04)
- [ ] Si es sustitución (motivo 01), solicitar UUID de reemplazo
- [ ] Actualizar estado en DB
- [ ] Guardar acuse de cancelación

---

## Fase 3 — Nice to Have (diferenciadores)

### 9. Dashboard de Métricas — COMPLETADO

- [x] Total facturado este mes (con desglose timbrado/por cobrar)
- [x] Facturas pendientes de cobro (borradores)
- [x] Comparativa vs mes anterior (delta %)
- [x] Desglose timbradas vs borradores (conteo + montos)
- [x] Facturas recientes con links a detalle
- [x] Estado vacío con onboarding
- [ ] Gráficas de tendencia

### 10. Gestión de Productos/Servicios

- [ ] Catálogo propio del usuario
- [ ] Campos: descripción, clave SAT, unidad, precio unitario
- [ ] Autocompletar al crear factura

### 11. Multi-RFC / Multi-empresa — COMPLETADO

- [x] Un usuario puede manejar varias empresas
- [x] Cada empresa con sus propios certificados, perfil emisor y facturas
- [x] Selector de perfil en formulario de factura
- [x] `issuingProfileId` en tabla de invoices
- [ ] Switcher de empresa en el sidebar

---

## Decisiones Pendientes

- [ ] **Elegir PAC** — SW SapienWare tiene la mejor DX para empezar rápido
- [x] ~~**Estrategia de almacenamiento de certificados**~~ — AES-256-GCM con `CERTIFICATE_ENCRYPTION_KEY`, en DB (archivos ~4KB)
- [x] ~~**Generación de PDF**~~ — `@react-pdf/renderer` (ya implementado)

---

## Mejoras de UI implementadas

- [x] Formularios envueltos en cards (`bg-card`) para contraste visual
- [x] Overlays unificados: `bg-black/60 backdrop-blur-sm` en Dialog, AlertDialog y Sheet
- [x] Animación de modales: fade-only 150ms (sin zoom/slide)
- [x] Input con `togglePassword` prop para mostrar/ocultar contraseña
- [x] Badges de archivos CSD con tokens del design system (no colores hardcoded)
- [x] Select con max-height 300px y scroll

---

## Notas Técnicas

- **CFDI versión:** 4.0 (vigente)
- **Certificados:** Password encriptado con AES-256-GCM. `.cer` y `.key` en base64 en DB. Clave en `CERTIFICATE_ENCRYPTION_KEY` env var
- **Metadata .cer:** Extraída con node-forge (serial, RFC, vigencia)
- **Validación .cer/.key:** TODO — bypasseada temporalmente, se validará al integrar PAC
- **XML:** Debe cumplir con el esquema XSD del SAT
- **Sello digital:** Se genera firmando la cadena original con la llave privada del emisor
- **Catálogos:** Servicio centralizado en `shared/services/sat-catalog.service.ts`, datos en DB
