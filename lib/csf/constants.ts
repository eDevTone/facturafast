/**
 * CSF Extraction Constants
 */

export const RFC_REGEX = /\b([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})\b/i;
export const IDCIF_REGEX = /\bidCIF:\s*(\d{8,14})\b/i;
export const IDCIF_FROM_D3_REGEX = /^(\d{8,14})_/;
export const LUGAR_FECHA_REGEX =
  /Lugar\s+y\s+Fecha\s+de\s+Emisi[oó]n\s+(.+?)\s+A\s+(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÜÑ]+)\s+DE\s+(\d{4})/i;

export const SAT_QR_BASE_URL =
  "https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?D3=";

export const SPANISH_MONTHS: Record<string, number> = {
  ENERO: 1,
  FEBRERO: 2,
  MARZO: 3,
  ABRIL: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGOSTO: 8,
  SEPTIEMBRE: 9,
  OCTUBRE: 10,
  NOVIEMBRE: 11,
  DICIEMBRE: 12,
};

export const CSF_MAX_AGE_DAYS = 30;

export const SECTION_IDENTIFICATION = "Datos de Identificación";
export const SECTION_ADDRESS = "Datos de Ubicación (domicilio fiscal, vigente)";
export const SECTION_FISCAL = "Características fiscales (vigente)";

export const IDENTIFICATION_KEYS = new Set([
  "El RFC",
  "Nombre, denominación o razón social",
  "Régimen de capital",
  "Nombre comercial",
]);

export const ADDRESS_KEYS = new Set([
  "Código Postal",
  "Tipo de vialidad",
  "Nombre de vialidad",
  "Número exterior",
  "Número interior",
  "Nombre de la colonia",
  "Nombre de la localidad",
  "Nombre del municipio o demarcación territorial",
  "Nombre de la entidad federativa",
  "Entre calle",
  "Y calle",
]);

export const FISCAL_KEYS = new Set([
  "Régimen",
  "Fecha de alta",
  "Fecha de inicio de operaciones",
]);
