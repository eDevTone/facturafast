/**
 * CSF Extraction Service
 * Calls eip-api to extract fiscal profile data from CSF PDFs
 */

import type { CsfPdfResponse, ParsedCsfResponse } from "../types/csf.types";

// eip-api runs on port 3001 with /api/v1 prefix
const CSF_API_URL = process.env.NEXT_PUBLIC_CSF_API_URL || "http://localhost:3001/api/v1";

/**
 * Extract CSF data from PDF file
 */
export async function extractCsfFromPdf(
  file: File
): Promise<CsfPdfResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${CSF_API_URL}/csf/parse-pdf`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to parse CSF" }));
    throw new Error(error.message || "Failed to parse CSF");
  }

  return response.json();
}

/**
 * Extract CSF data from SAT QR URL
 */
export async function extractCsfFromUrl(
  url: string
): Promise<ParsedCsfResponse> {
  const response = await fetch(`${CSF_API_URL}/csf/parse-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to parse CSF from URL" }));
    throw new Error(error.message || "Failed to parse CSF from URL");
  }

  return response.json();
}

/**
 * Map CSF data to client form values
 */
export function mapCsfToClientData(csf: CsfPdfResponse | ParsedCsfResponse) {
  const sections = csf.sections;
  const identification = sections["Datos de Identificación"] || {};
  const location = sections["Datos de Ubicación (domicilio fiscal, vigente)"] || {};
  const fiscal = sections["Características fiscales (vigente)"] || {};

  // Extract regimen fiscal (first active one)
  const regimenes = fiscal["Régimen"] as Array<{ Régimen: string }> | undefined;
  
  // Extract just the code (e.g., "601" from "601 - General de Ley Personas Morales")
  let regimenFiscal = null;
  if (regimenes && regimenes.length > 0) {
    const regimenText = regimenes[0].Régimen;
    const match = regimenText.match(/^(\d{3})/);
    regimenFiscal = match ? match[1] : regimenText;
  }

  // Get name/razon social
  const razonSocial = identification["Nombre, denominación o razón social"] as string || "";

  // Get CP
  const codigoPostal = location["Código Postal"] as string || "";

  return {
    rfc: csf.rfc || "",
    razonSocial,
    codigoPostal,
    regimenFiscal,
    // Optional fields not in CSF
    email: "",
    telefono: "",
  };
}
