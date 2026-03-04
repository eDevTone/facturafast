/**
 * CSF Extraction Service
 * Client-safe utilities for mapping CSF data to form values
 */

import type { CsfPdfResponse } from "../types/csf.types";

/** Map regimen name text to its SAT code */
const REGIMEN_CODE_MAP: Record<string, string> = {
  "general de ley personas morales": "601",
  "personas morales con fines no lucrativos": "603",
  "sueldos y salarios e ingresos asimilados a salarios": "605",
  "arrendamiento": "606",
  "demás ingresos": "608",
  "residentes en el extranjero": "610",
  "ingresos por dividendos": "611",
  "personas físicas con actividades empresariales y profesionales": "612",
  "personas físicas con actividades empresariales": "612",
  "ingresos por intereses": "614",
  "régimen de los ingresos por obtención de premios": "615",
  "sin obligaciones fiscales": "616",
  "incorporación fiscal": "621",
  "actividades empresariales con ingresos a través de plataformas tecnológicas": "625",
  "régimen simplificado de confianza": "626",
  "simplificado de confianza": "626",
};

function extractRegimenCode(regimenText: string): string | null {
  // First try: extract numeric code directly (e.g., "601 - General de Ley...")
  const codeMatch = regimenText.match(/^(\d{3})/);
  if (codeMatch) return codeMatch[1];

  // Second try: match name against known regimes
  const lower = regimenText.toLowerCase().replace(/^régimen\s+/i, "").trim();
  for (const [name, code] of Object.entries(REGIMEN_CODE_MAP)) {
    if (lower.includes(name) || name.includes(lower)) {
      return code;
    }
  }

  return null;
}

/** Suggest Uso CFDI based on regimen fiscal code */
function suggestUsoCfdi(regimenCode: string | null): string {
  if (!regimenCode) return "G03";

  switch (regimenCode) {
    case "601": // General de Ley PM
    case "603": // PM sin fines de lucro
      return "G03"; // Gastos en general
    case "605": // Sueldos y salarios
      return "D01"; // Honorarios médicos (common for employees)
    case "606": // Arrendamiento
      return "G03";
    case "612": // PF con actividades empresariales
      return "G03";
    case "626": // RESICO
      return "G03";
    case "616": // Sin obligaciones
      return "S01"; // Sin efectos fiscales
    default:
      return "G03";
  }
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
  const regimenes = ((fiscal as Record<string, unknown>)["regimenes"] ??
    fiscal["Régimen"]) as Array<{ Régimen: string }> | undefined;

  let regimenFiscal: string | null = null;
  if (Array.isArray(regimenes) && regimenes.length > 0) {
    const regimenText = regimenes[0].Régimen ?? String(regimenes[0]);
    regimenFiscal = extractRegimenCode(regimenText);
  }

  // Get name/razon social
  // Persona moral: "Denominación o Razón Social"
  // Persona física: "Nombre" + "Apellido Paterno" + "Apellido Materno"
  const firstString = (v: unknown): string => {
    if (Array.isArray(v)) return String(v[0] || "");
    return String(v || "");
  };
  let razonSocial = firstString(identification["Denominación o Razón Social"]);
  if (!razonSocial) {
    const nombre = firstString(identification["Nombre"]);
    const apellidoPaterno = firstString(identification["Apellido Paterno"]);
    const apellidoMaterno = firstString(identification["Apellido Materno"]);
    razonSocial = [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ");
  }

  // Get CP
  const codigoPostal = (location["CP"] as string) || "";

  // Get email - handle both string and array
  const rawEmail = location["Correo electrónico"];
  const email = Array.isArray(rawEmail) ? rawEmail[0] || "" : (rawEmail as string) || "";

  // Suggest Uso CFDI based on regimen
  const usoCfdi = suggestUsoCfdi(regimenFiscal);

  return {
    rfc: csf.rfc || "",
    razonSocial,
    codigoPostal,
    regimenFiscal,
    email,
    usoCfdi,
    telefono: "",
  };
}
