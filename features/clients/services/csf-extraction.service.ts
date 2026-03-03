/**
 * CSF Extraction Service
 * Extracts fiscal profile data from CSF PDFs using lib/csf
 */

import { extractCsfDataFromPdf } from "@/lib/csf";
import type { CsfPdfResponse } from "../types/csf.types";

/**
 * Extract CSF data from PDF file
 */
export async function extractCsfFromPdf(file: File): Promise<CsfPdfResponse> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract using lib/csf
  const result = await extractCsfDataFromPdf(buffer);

  return {
    ...result,
    extracted_from_pdf: {
      ...result.extracted_from_pdf,
      filename: file.name,
    },
  } as CsfPdfResponse;
}

/**
 * Map CSF data to client form values
 */
export function mapCsfToClientData(csf: CsfPdfResponse) {
  const sections = csf.sections;
  const identification = sections["Datos de Identificación"] || {};
  const location =
    sections["Datos de Ubicación (domicilio fiscal, vigente)"] || {};
  const fiscal = sections["Características fiscales (vigente)"] || {};

  // Extract regimen fiscal (first active one)
  const regimenes = fiscal["Régimen"] as
    | Array<{ Régimen: string }>
    | undefined;

  // Extract just the code (e.g., "601" from "601 - General de Ley Personas Morales")
  let regimenFiscal = null;
  if (regimenes && regimenes.length > 0) {
    const regimenText = regimenes[0].Régimen;
    const match = regimenText.match(/^(\d{3})/);
    regimenFiscal = match ? match[1] : regimenText;
  }

  // Get name/razon social
  const razonSocial =
    (identification["Nombre, denominación o razón social"] as string) || "";

  // Get CP
  const codigoPostal = (location["Código Postal"] as string) || "";

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
