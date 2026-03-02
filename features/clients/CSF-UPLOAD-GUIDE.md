# CSF Upload & Auto-Fill Feature

## 📋 Overview

Feature para cargar la **Constancia de Situación Fiscal (CSF)** del SAT y auto-llenar el formulario de cliente con los datos extraídos.

**Status:** ✅ UI Complete | ⏳ API Integration Pending

---

## 🎯 User Flow

1. **Usuario crea nuevo cliente** (`/clientes/nuevo`)
2. **Upload CSF (opcional):**
   - Arrastra/selecciona PDF del CSF
   - Valida formato (PDF) y tamaño (<5MB)
   - Click "Extraer Datos"
3. **Extracción automática:**
   - Loading state (2s simulated delay)
   - Extrae: RFC, Razón Social, Régimen Fiscal, Código Postal
   - Auto-llena campos del formulario
4. **Usuario revisa/edita:**
   - Puede corregir datos si hay errores
   - Completa campos faltantes (email, teléfono)
5. **Guarda cliente** normalmente

---

## 🛠️ Technical Implementation

### Components

**CSFUpload Component** (`csf-upload.tsx`)
```tsx
interface CSFUploadProps {
  onDataExtracted: (data: {
    rfc: string
    razonSocial: string
    regimenFiscal?: string
    codigoPostal: string
  }) => void
}
```

**Features:**
- Drag & drop support
- PDF validation (type + size)
- Base64 conversion
- Loading states
- Error handling
- File preview

**ClientForm Integration** (`client-form.tsx`)
```tsx
const handleCSFData = (data) => {
  form.setValue('rfc', data.rfc)
  form.setValue('razonSocial', data.razonSocial)
  form.setValue('codigoPostal', data.codigoPostal)
  if (data.regimenFiscal) {
    form.setValue('regimenFiscal', data.regimenFiscal)
  }
}
```

---

## 🔌 API Integration (TODO)

### Current: Mock Extraction

```typescript
// Mock data (simulates API response)
const mockData = {
  rfc: 'XAXX010101000',
  razonSocial: 'EMPRESA EJEMPLO SA DE CV',
  regimenFiscal: '601',
  codigoPostal: '76000'
}
```

### Next: Real API

**Option 1: Server Action (Recommended)**

```typescript
// features/clients/actions/extract-csf.action.ts
'use server'

export async function extractCSFData(base64PDF: string) {
  try {
    // Call your CSF extraction API
    const response = await fetch('https://api.tu-servicio.com/csf/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf: base64PDF })
    })

    const data = await response.json()

    return {
      success: true,
      data: {
        rfc: data.rfc,
        razonSocial: data.razonSocial,
        regimenFiscal: data.regimenFiscal,
        codigoPostal: data.codigoPostal
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al extraer datos del CSF'
    }
  }
}
```

**Usage in CSFUpload:**
```typescript
import { extractCSFData } from '../actions/extract-csf.action'

const handleExtract = async () => {
  const result = await extractCSFData(base64)
  
  if (result.success) {
    onDataExtracted(result.data)
  } else {
    setError(result.error)
  }
}
```

**Option 2: API Route**

```typescript
// app/api/csf/extract/route.ts
export async function POST(request: Request) {
  const { pdf } = await request.json()
  
  // Extract data from PDF
  const extractedData = await yourExtractionService(pdf)
  
  return Response.json(extractedData)
}
```

---

## 📊 Data Extracted from CSF

**Campos que se extraen automáticamente:**

| Campo | Descripción | Required |
|-------|-------------|----------|
| `rfc` | RFC del contribuyente | ✅ |
| `razonSocial` | Razón social / Nombre | ✅ |
| `regimenFiscal` | Código régimen fiscal (601, 612, etc.) | ⚠️ |
| `codigoPostal` | CP del domicilio fiscal | ✅ |

**Campos que el usuario completa manualmente:**
- Email
- Teléfono
- Uso CFDI (default: P01)

---

## 🔐 Security Considerations

### Current (Mock)
- ✅ PDF validation (type + size)
- ✅ Client-side base64 conversion
- ⚠️ No persistence (mock only)

### Production (TODO)
1. **File Upload:**
   - Upload PDF to R2 storage
   - Generate signed URL
   - Store URL in DB (`constanciaFiscalUrl`)

2. **API Security:**
   - Rate limiting (avoid abuse)
   - File size limits enforced
   - Malware scanning (optional)
   - Auth token required

3. **Data Validation:**
   - Validate extracted RFC format
   - Cross-check with SAT lists (optional)
   - Allow manual correction

---

## 📝 Database Schema (Future)

Add CSF URL field to clients table:

```typescript
// database/schemas/clients.ts
export const clients = pgTable('clients', {
  // ... existing fields
  constanciaFiscalUrl: text('constancia_fiscal_url'), // NEW
  // ...
})
```

Migration:
```sql
ALTER TABLE clients 
ADD COLUMN constancia_fiscal_url TEXT;
```

---

## 🎨 UI/UX Details

### States

**Empty State:**
```
┌─────────────────────────────────────┐
│ 📤 Acta de Situación Fiscal        │
│ Sube el PDF del CSF para llenar    │
│ automáticamente el formulario      │
│                                     │
│ [Haz clic o arrastra PDF aquí]     │
│ [Extraer Datos (disabled)]         │
└─────────────────────────────────────┘
```

**File Selected:**
```
┌─────────────────────────────────────┐
│ 📄 CSF_2024.pdf (245 KB)           │
│ [Extraer Datos] ← enabled          │
└─────────────────────────────────────┘
```

**Loading:**
```
┌─────────────────────────────────────┐
│ ⏳ Extrayendo datos...             │
│ [Spinner animation]                 │
└─────────────────────────────────────┘
```

**Success:**
```
✅ Datos extraídos del CSF. 
Revisa y completa la información faltante.

[Campos auto-llenados con datos extraídos]
```

**Error:**
```
❌ Error al extraer datos del CSF. 
Intenta de nuevo o completa manualmente.
```

---

## 🔄 Next Steps (Priority Order)

1. **Phase 1: API Integration** (Week 1-2)
   - [ ] Select/build CSF extraction API
   - [ ] Create server action `extract-csf.action.ts`
   - [ ] Test with real CSF PDFs
   - [ ] Handle edge cases

2. **Phase 2: Storage** (Week 1-2)
   - [ ] Setup R2 bucket for CSF files
   - [ ] Add `constanciaFiscalUrl` to DB schema
   - [ ] Upload PDF after extraction
   - [ ] Store signed URL in DB

3. **Phase 3: Enhancements** (Week 2-3)
   - [ ] Download CSF from client view
   - [ ] Re-process CSF if data incorrect
   - [ ] Show extraction confidence scores
   - [ ] Multi-page CSF support

4. **Phase 4: Advanced** (Optional)
   - [ ] OCR for scanned CSFs
   - [ ] Batch CSF upload
   - [ ] Auto-update client data from new CSF
   - [ ] CSF expiration alerts

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] Upload valid PDF (< 5MB)
- [ ] Upload invalid file (not PDF)
- [ ] Upload oversized PDF (> 5MB)
- [ ] Drag & drop PDF
- [ ] Extract data (mock)
- [ ] Verify auto-filled fields
- [ ] Edit auto-filled data
- [ ] Save client with CSF data
- [ ] Save client without CSF (skip)

### Integration Testing

- [ ] API extraction success
- [ ] API extraction failure
- [ ] Network timeout
- [ ] Invalid PDF content
- [ ] Partial data extraction

---

## 📚 References

- **SAT CSF Format:** [SAT Official Docs](https://www.sat.gob.mx)
- **PDF Processing Libraries:**
  - `pdf-parse` (Node.js)
  - `pdf.js` (Client-side)
  - `PyPDF2` (Python API)

---

**Last Updated:** 2026-03-02  
**Status:** ✅ UI Ready | ⏳ API Pending  
**Next Action:** Integrate real CSF extraction API
