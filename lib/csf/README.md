# CSF Extraction Library

Biblioteca auto-contenida para extracción de datos de Constancia de Situación Fiscal (SAT).

## 📁 Estructura

```
lib/csf/
├── constants.ts      # Regex, URLs, catálogos SAT
├── utils.ts          # Utilidades de strings
├── pdf-wrapper.ts    # Wrapper para pdf-parse (CommonJS)
├── pdf-parser.ts     # Extracción de texto de PDF
├── sat-fetcher.ts    # HTTP fetch a SAT
├── html-parser.ts    # Parseo de HTML del SAT
├── index.ts          # Entry point principal
└── README.md         # Esta documentación
```

## 🚀 Uso

```typescript
import { extractCsfDataFromPdf } from "@/lib/csf";

const buffer = Buffer.from(await file.arrayBuffer());
const data = await extractCsfDataFromPdf(buffer);

console.log(data.rfc);              // "XAXX010101000"
console.log(data.taxpayer_type);    // "persona_moral"
console.log(data.sections);         // Datos estructurados
```

## 📦 Módulos

### `constants.ts`
Constantes y catálogos:
- Regex (RFC, idCIF, fecha)
- URLs del SAT
- Meses en español
- Secciones de CSF
- Keys de identificación/domicilio/fiscal

### `utils.ts`
Utilidades de strings:
- `normalizeSpace()` - Normaliza espacios
- `cleanValue()` - Limpia JavaScript del HTML
- `mergeBrokenTokens()` - Une tokens rotos
- `upsertKeyValue()` - Inserta/actualiza key-value

### `pdf-wrapper.ts`
Wrapper para pdf-parse:
- Usa `eval(require())` para bypass del bundler
- Maneja módulo CommonJS en Next.js

### `pdf-parser.ts`
Parseo de PDF:
- `extractTextFromPdf()` - Extrae texto del PDF
- `tryBuildSatUrlFromText()` - Construye URL del SAT
- `extractCreationPlaceAndDate()` - Extrae lugar/fecha
- `validateCsfAge()` - Valida antigüedad del CSF

### `sat-fetcher.ts`
Fetch al SAT:
- `validateSatUrl()` - Validación SSRF
- `fetchSatHtml()` - Fetch con headers apropiados

### `html-parser.ts`
Parseo de HTML:
- `parseSatHtml()` - Extrae datos estructurados
- Limpia JavaScript del HTML
- Clasifica tipo de contribuyente
- Agrupa por secciones

### `index.ts`
Entry point:
- `extractCsfDataFromPdf()` - Función principal
- Re-exports útiles

## 🔄 Flujo

```
1. PDF Buffer
     ↓
2. extractTextFromPdf() → Texto plano
     ↓
3. tryBuildSatUrlFromText() → URL SAT
     ↓
4. fetchSatHtml() → HTML del SAT
     ↓
5. parseSatHtml() → Datos estructurados
     ↓
6. Metadata (lugar, fecha, edad CSF)
     ↓
7. Resultado final
```

## 📊 Output

```typescript
{
  provider: "SAT (Validador QR)",
  rfc: "XAXX010101000",
  taxpayer_type: "persona_moral",
  sections: {
    "Datos de Identificación": {
      "El RFC": "XAXX010101000",
      "Nombre, denominación o razón social": "EMPRESA SA DE CV"
    },
    "Datos de Ubicación (domicilio fiscal, vigente)": {
      "Código Postal": "76000",
      ...
    },
    "Características fiscales (vigente)": {
      "Régimen": [
        {
          "Régimen": "601 - General de Ley Personas Morales",
          "Fecha de alta": "01/01/2020"
        }
      ]
    }
  },
  source_url: "https://siat.sat.gob.mx/...",
  idCIF: "12345678",
  extracted_from_pdf: {
    filename: "csf.pdf",
    sat_url: "https://siat.sat.gob.mx/...",
    sat_url_source: "pdf_text",
    creation_place: "Ciudad de México, México",
    creation_date: "2024-01-15T00:00:00.000Z",
    days_old: 45,
    CSF_OK: "WARNING: CSF is 45 days old (more than 30 days)"
  }
}
```

## 🧪 Testing

```typescript
// Test individual modules
import { normalizeSpace } from "@/lib/csf/utils";
import { validateSatUrl } from "@/lib/csf/sat-fetcher";

// Test full extraction
import { extractCsfDataFromPdf } from "@/lib/csf";
```

## 🔒 Seguridad

- **SSRF Protection**: Solo permite URLs de `siat.sat.gob.mx`
- **XSS Protection**: Limpia código JavaScript del HTML
- **Input Validation**: Valida buffers no vacíos

## 📝 Notas

- Usa `eval(require())` para manejar pdf-parse (CommonJS)
- Solo procesa primeras 2 páginas del PDF (optimización)
- Timeout de 20 segundos para fetch al SAT
- Maneja redirects del SAT automáticamente
