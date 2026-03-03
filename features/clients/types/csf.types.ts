/**
 * CSF Types - Mirror from eip-api
 */

export type TaxpayerType = "persona_fisica" | "persona_moral" | null;

export interface FiscalRegime {
  Régimen: string;
  "Fecha de alta": string;
}

export interface CsfSections {
  "Datos de Identificación": Record<string, string | string[]>;
  "Datos de Ubicación (domicilio fiscal, vigente)": Record<string, string | string[]>;
  "Características fiscales (vigente)": Record<string, string | string[] | FiscalRegime[]>;
}

export interface ParsedCsfResponse {
  provider: string;
  rfc: string | null;
  taxpayer_type: TaxpayerType;
  sections: CsfSections;
  source_url?: string;
  idCIF?: string | null;
}

export interface PdfExtractionMetadata {
  filename: string;
  sat_url: string;
  sat_url_source: "pdf_text" | "qr" | null;
  creation_place: string | null;
  creation_date: string | null;
  days_old: number | null;
  CSF_OK: string | null;
}

export interface CsfPdfResponse extends ParsedCsfResponse {
  extracted_from_pdf: PdfExtractionMetadata;
}
