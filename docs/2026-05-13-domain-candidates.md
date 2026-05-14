# Dominios candidatos para FacturaFast

**Fecha de verificación:** 2026-05-13
**Método:** combinación de `dig` (registros NS) + `whois -h whois.verisign-grs.com` (autoritativo para `.com`) + RDAP IANA (autoritativo para `.app`). Para `.mx` se usa ausencia de DNS porque NIC México bloquea WHOIS público desde 2018.

## TL;DR — Recomendaciones

| Posición | Dominio | Confianza | Razón |
|---|---|---|---|
| 🥇 | **`timbralia.mx`** | Alta | Sufijo `-ia` estilo SaaS moderno (Notion, Linear). `.mx` afirma el mercado. Brandable y único. |
| 🥈 | **`flashfactura.com`** | **Confirmada 100%** | `.com` global, mantiene el ADN "fast" de la marca actual. Verificado libre vía Verisign. |
| 🥉 | **`timbrar.app`** | **Confirmada 100%** | Verbo de acción + TLD `.app` premium con HTTPS forzado. Verificado libre vía RDAP. |

---

## Resultados completos

### ✅ Disponibles — confirmados al 100%

Estos los puedes comprar hoy mismo en cualquier registrar (Namecheap, Porkbun, Cloudflare Registrar).

| Dominio | TLD | Estado | Verificación |
|---|---|---|---|
| **`flashfactura.com`** | `.com` | 🟢 Libre | Verisign: `No match for domain "FLASHFACTURA.COM"` |
| **`zoomfactura.com`** | `.com` | 🟢 Libre | Verisign: `No match for domain "ZOOMFACTURA.COM"` |
| **`timbrar.app`** | `.app` | 🟢 Libre | RDAP IANA: `errorCode: 404 — Domain not found` |

### ✅ Muy probablemente disponibles (`.mx`)

`NIC México` cerró el WHOIS público en 2018, así que no se puede verificar autoritativamente desde terminal. La señal usada es **ausencia total de registros DNS** (NS, A, ANY). Los dominios `.mx` cuestan ~$30 USD/año y raramente se registran sin configurar DNS, por lo que esta señal es muy confiable.

Para confirmación 100%, consulta directamente en [registry.mx](https://www.registry.mx) o intenta agregarlo al carrito en un registrar acreditado como Akky o GoDaddy MX.

| Dominio | TLD | Estado | Verificación |
|---|---|---|---|
| **`timbralia.mx`** | `.mx` | 🟢 Probable | Sin NS / A / ANY records |
| **`emiteya.mx`** | `.mx` | 🟢 Probable | Sin NS / A / ANY records |
| **`cfdiapp.mx`** | `.mx` | 🟢 Probable | Sin NS / A / ANY records |
| **`factupro.mx`** | `.mx` | 🟢 Probable | Sin NS / A / ANY records |
| **`factuya.mx`** | `.mx` | 🟢 Probable | Sin NS / A / ANY records |

### ❌ Tomados

| Dominio | TLD | Detalle |
|---|---|---|
| `timbralo.mx` | `.mx` | DNS apuntando a Digital Ocean |
| `timbralo.com` | `.com` | DNS apuntando a NameBright |
| `timbralia.com` | `.com` | Registrado 2019 (GoDaddy) |
| `facturapp.mx` | `.mx` | DNS apuntando a AWS Route 53 |
| `facturapp.com` | `.com` | DNS apuntando a Digital Ocean |
| `facturafy.com` | `.com` | DNS apuntando a Bluehost |
| `facturai.mx` | `.mx` | DNS apuntando a GoDaddy |
| `cfdiapp.com` | `.com` | DNS apuntando a Anycast |
| `timbrar.mx` | `.mx` | DNS apuntando a Cloudflare |
| `rapifact.com` | `.com` | DNS apuntando a Cloudflare |
| `factuhub.com` | `.com` | DNS apuntando a UI-DNS (1&1 IONOS) |
| `factura.lat` | `.lat` | Registrado 2025-12-08 (Namecheap, muy reciente) |

---

## Comentarios estratégicos por opción

### Top picks para registrar hoy

**`timbralia.mx`** — Mi recomendación si tuviera que elegir uno solo. El sufijo `-ia` está de moda en marcas SaaS (Notion, Linear, Vercel). "Timbra" es la acción específica que tu producto resuelve. El `.mx` deja claro el mercado y reduce dependencia de la versión `.com` (cara y poco probable de conseguir).

**`flashfactura.com`** — La opción más segura si quieres el `.com`. Mantiene el concepto "fast" que ya estás comunicando ahora con FacturaFast. Si más adelante decides hacer rebrand desde "FacturaFast" a "FlashFactura" es un cambio mínimo de marca.

**`timbrar.app`** — El más limpio técnicamente. `.app` exige HTTPS, lo que da señal premium para una fintech-adjacent. El verbo solo, sin sufijo, transmite "esta es la herramienta que sirve para timbrar". Único riesgo: la gente en México está más acostumbrada a `.com.mx` / `.mx` que a `.app`.

### Alternativas si quieres explorar `.mx`

- **`emiteya.mx`** — Verbo + urgencia. Comunica acción inmediata.
- **`cfdiapp.mx`** — Directo al estándar técnico. Si tu audiencia es contadores/empresas que ya saben qué es CFDI, no necesita explicación.
- **`factuya.mx`** — Tono coloquial mexicano. Memorable. Bueno para B2C pero quizás demasiado informal para B2B grande.
- **`factupro.mx`** — Sugiere herramienta para profesionales. Más serio que `factuya`.

### Mantén `FACTURAFAST` como statement descriptor de Stripe mientras decides

Stripe valida que el descriptor coincida con el **nombre del negocio** (no necesariamente el dominio). Puedes registrar `timbralia.mx` y mantener `FACTURAFAST` en Stripe — eso sí, cuando cambies de marca pública, actualiza también el descriptor.

---

## Cómo registrar

| Registrar | Pros | Contras |
|---|---|---|
| [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) | Precio al costo (sin markup), WHOIS privacy gratis, DNS rápido | No soporta `.mx` |
| [Porkbun](https://porkbun.com) | Precios bajos, UI moderna, WHOIS privacy gratis | Soporte `.mx` limitado |
| [Namecheap](https://www.namecheap.com) | Soporta `.mx`, precios decentes, WHOIS privacy gratis | UI menos pulida |
| [Akky](https://www.akky.mx) | Registrar oficial mexicano, soporte local | Más caro, UI antigua |

**Para `.mx`**: usa Akky (oficial) o Namecheap (precio mejor).
**Para `.com` / `.app`**: usa Cloudflare Registrar (más barato a largo plazo).

## Cómo re-verificar los `.mx` antes de comprar

```bash
# Si DNS sigue vacío, sigue libre
dig +short NS timbralia.mx
dig +short A timbralia.mx

# O directamente en https://www.registry.mx en la barra de búsqueda
```
