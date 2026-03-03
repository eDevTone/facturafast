/**
 * CSF Extraction - Self-contained (copied from eip-api)
 * Extracts fiscal data from CSF PDFs without external API
 */

import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
import { parsePdf } from "./pdf-parser-wrapper";

// ============================================================================
// CONSTANTS
// ============================================================================

const RFC_REGEX = /\b([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})\b/i;
const IDCIF_REGEX = /\bidCIF:\s*(\d{8,14})\b/i;
const IDCIF_FROM_D3_REGEX = /^(\d{8,14})_/;
const LUGAR_FECHA_REGEX =
  /Lugar\s+y\s+Fecha\s+de\s+Emisi[oó]n\s+(.+?)\s+A\s+(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÜÑ]+)\s+DE\s+(\d{4})/i;

const SAT_QR_BASE_URL =
  "https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?D3=";

const SPANISH_MONTHS: Record<string, number> = {
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

const CSF_MAX_AGE_DAYS = 30;

const SECTION_IDENTIFICATION = "Datos de Identificación";
const SECTION_ADDRESS = "Datos de Ubicación (domicilio fiscal, vigente)";
const SECTION_FISCAL = "Características fiscales (vigente)";

const IDENTIFICATION_KEYS = new Set([
  "El RFC",
  "Nombre, denominación o razón social",
  "Régimen de capital",
  "Nombre comercial",
]);

const ADDRESS_KEYS = new Set([
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

const FISCAL_KEYS = new Set([
  "Régimen",
  "Fecha de alta",
  "Fecha de inicio de operaciones",
]);

// ============================================================================
// UTILS
// ============================================================================

function normalizeSpace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function normalizeKey(s: string): string {
  return normalizeSpace(s.replace(/:$/, ""));
}

function looksLikeLabelToken(s: string): boolean {
  return s.endsWith(":") || /^[A-ZÁÉÍÓÚÜÑ\s]+$/.test(s);
}

function mergeBrokenTokens(tokens: string[]): string[] {
  const result: string[] = [];
  let buffer = "";

  for (const t of tokens) {
    if (looksLikeLabelToken(t)) {
      if (buffer) result.push(buffer);
      buffer = t;
    } else if (buffer) {
      buffer += " " + t;
    } else {
      result.push(t);
    }
  }

  if (buffer) result.push(buffer);
  return result;
}

// ============================================================================
// PDF PARSER
// ============================================================================

async function extractTextFromPdf(
  pdfBuffer: Buffer,
  maxPages = 2
): Promise<string> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("Empty PDF buffer");
  }

  // Use wrapper that handles require() properly
  const data = await parsePdf(pdfBuffer, { max: maxPages });

  if (!data.text || data.text.trim().length === 0) {
    throw new Error("PDF has no text content");
  }

  return data.text;
}

function tryBuildSatUrlFromText(text: string): string | null {
  try {
    const idCifMatch = IDCIF_REGEX.exec(text);
    if (!idCifMatch) return null;

    const rfcMatch = RFC_REGEX.exec(text);
    if (!rfcMatch) return null;

    const idCif = idCifMatch[1];
    const rfc = rfcMatch[1].toUpperCase();
    const d3 = `${idCif}_${rfc}`;

    return SAT_QR_BASE_URL + d3;
  } catch {
    return null;
  }
}

function extractIdCifFromUrl(satUrl: string): string | null {
  try {
    const url = new URL(satUrl);
    const d3 = url.searchParams.get("D3");
    if (!d3) return null;

    const decoded = decodeURIComponent(d3);
    const match = IDCIF_FROM_D3_REGEX.exec(decoded);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function extractCreationPlaceAndDate(text: string) {
  const normalizedText = normalizeSpace(text);
  const match = LUGAR_FECHA_REGEX.exec(normalizedText);

  if (!match) {
    return { place: null, date: null };
  }

  const placeRaw = match[1];
  const day = parseInt(match[2], 10);
  const monthName = match[3].toUpperCase();
  const year = parseInt(match[4], 10);

  const month = SPANISH_MONTHS[monthName];
  if (!month) {
    return { place: normalizeSpace(placeRaw), date: null };
  }

  let place = normalizeSpace(placeRaw);
  place = place.replace(/\s*,\s*/g, ", ");

  return {
    place,
    date: new Date(year, month - 1, day),
  };
}

function validateCsfAge(creationDate: Date | null) {
  if (!creationDate) {
    return { daysOld: null, message: null };
  }

  const today = new Date();
  const diffTime = today.getTime() - creationDate.getTime();
  const daysOld = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysOld <= CSF_MAX_AGE_DAYS) {
    return {
      daysOld,
      message: `CSF is OK and less than ${CSF_MAX_AGE_DAYS} days old`,
    };
  }

  return {
    daysOld,
    message: `WARNING: CSF is ${daysOld} days old (more than ${CSF_MAX_AGE_DAYS} days)`,
  };
}

// ============================================================================
// SAT FETCHER
// ============================================================================

function validateSatUrl(url: string): void {
  const parsedUrl = new URL(url);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("URL must be http/https");
  }
  if (parsedUrl.hostname.toLowerCase() !== "siat.sat.gob.mx") {
    throw new Error("Only siat.sat.gob.mx is allowed (SSRF protection)");
  }
}

async function fetchSatHtml(url: string) {
  validateSatUrl(url);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-MX,es;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  const httpsAgent = new https.Agent({
    rejectUnauthorized: true,
  });

  const response = await axios.get(url, {
    headers,
    timeout: 20000,
    maxRedirects: 5,
    httpsAgent,
    validateStatus: (status) => status < 500,
  });

  if (response.status >= 400) {
    throw new Error(`Upstream SAT error: ${response.status}`);
  }

  const redirects: Array<{ status: number; to: string }> = [];
  if (response.request?.res?.responseUrl !== url) {
    redirects.push({
      status: 302,
      to: response.request?.res?.responseUrl || url,
    });
  }

  return {
    urlFinal: response.request?.res?.responseUrl || url,
    statusCode: response.status,
    history: redirects,
    text: response.data,
    contentType: response.headers["content-type"] || "",
  };
}

// ============================================================================
// HTML PARSER
// ============================================================================

type TaxpayerType = "persona_fisica" | "persona_moral" | null;

function classifyTaxpayer(rfc: string): TaxpayerType {
  if (rfc.length === 12) return "persona_moral";
  if (rfc.length === 13) return "persona_fisica";
  return null;
}

function upsertKv(
  container: Record<string, string | string[]>,
  key: string,
  val: string
): void {
  if (!key || !val) return;

  if (!(key in container)) {
    container[key] = val;
    return;
  }

  const existing = container[key];
  if (Array.isArray(existing)) {
    existing.push(val);
  } else {
    container[key] = [existing, val];
  }
}

function stripSectionTitleSuffix(v: string): string {
  let value = normalizeSpace(v);
  const titles = [SECTION_IDENTIFICATION, SECTION_ADDRESS, SECTION_FISCAL];

  for (const title of titles) {
    if (value.endsWith(title)) {
      value = normalizeSpace(value.slice(0, -title.length));
    }
  }

  return value;
}

function moveKeys(
  rawKv: Record<string, string | string[]>,
  keyset: Set<string>,
  section: Record<string, any>
): void {
  for (const k of Object.keys(rawKv)) {
    if (keyset.has(k)) {
      section[k] = rawKv[k];
      delete rawKv[k];
    }
  }
}

function isJavaScriptCode(text: string): boolean {
  const jsPatterns = [
    /^\s*\$\s*\(/,
    /^\s*function\s*\(/,
    /PrimeFaces\./,
    /\.cw\s*\(/,
    /window\.(onload|onready)/i,
    /navigator\./,
    /document\./,
    /console\.(log|warn|error)/,
    /var\s+\w+\s*=/,
    /\{id:'/,
    /widget_/,
  ];

  return jsPatterns.some((pattern) => pattern.test(text));
}

function cleanValue(value: string): string {
  if (isJavaScriptCode(value)) {
    return "";
  }

  const cleaned = value
    .replace(/\$\s*\(\s*function\s*\(\s*\)\s*\{[^}]*\}\s*\)\s*;?\s*/g, "")
    .replace(/window\.\w+\s*=\s*function[^}]*\}[^}]*\}/g, "")
    .replace(/PrimeFaces\.[^;]+;?\s*/g, "")
    .replace(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, "")
    .replace(/\s*;\s*/g, " ")
    .trim();

  return normalizeSpace(cleaned);
}

function parseSatHtml(html: string) {
  const $ = cheerio.load(html);

  $("script").remove();
  $("style").remove();
  $("noscript").remove();

  const tokens: string[] = [];
  $("body")
    .find("*")
    .not("script, style, noscript")
    .each((_, el) => {
      const $el = $(el);
      if ($el.is("script, style, noscript")) return;

      const text = $el
        .contents()
        .filter(function () {
          return this.type === "text";
        })
        .text();
      const normalized = normalizeSpace(text);
      if (normalized && !isJavaScriptCode(normalized)) {
        tokens.push(normalized);
      }
    });

  const bodyText = $("body").text();
  const textTokens = bodyText
    .split(/\n/)
    .map((t) => normalizeSpace(t))
    .filter((t) => t && !isJavaScriptCode(t));

  const allTokens = mergeBrokenTokens([
    ...new Set([...tokens, ...textTokens]),
  ]);
  const fullText = allTokens.join(" ");

  const rawKv: Record<string, string | string[]> = {};

  let rfc: string | null = null;
  let taxpayerType: TaxpayerType = null;

  const rfcMatch = fullText.match(
    /El RFC:\s*([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})/i
  );
  if (rfcMatch) {
    rfc = rfcMatch[1].toUpperCase();
    taxpayerType = classifyTaxpayer(rfc);
    rawKv["El RFC"] = rfc;
  } else {
    const tokenRfcMatch = fullText.match(RFC_REGEX);
    if (tokenRfcMatch) {
      rfc = tokenRfcMatch[1].toUpperCase();
      taxpayerType = classifyTaxpayer(rfc);
      rawKv["El RFC"] = rfc;
    }
  }

  let currentLabel: string | null = null;
  let currentValueParts: string[] = [];

  const flush = () => {
    if (currentLabel !== null) {
      const key = normalizeKey(currentLabel);
      const rawVal = normalizeSpace(currentValueParts.join(" "));
      const val = cleanValue(rawVal);
      if (key && val) {
        upsertKv(rawKv, key, val);
      }
    }
    currentLabel = null;
    currentValueParts = [];
  };

  for (const tok of allTokens) {
    if (looksLikeLabelToken(tok)) {
      flush();
      currentLabel = tok;
    } else if (currentLabel !== null) {
      if (!isJavaScriptCode(tok)) {
        currentValueParts.push(tok);
      }
    }
  }
  flush();

  const sections: any = {
    [SECTION_IDENTIFICATION]: {},
    [SECTION_ADDRESS]: {},
    [SECTION_FISCAL]: {},
  };

  moveKeys(rawKv, IDENTIFICATION_KEYS, sections[SECTION_IDENTIFICATION]);
  moveKeys(rawKv, ADDRESS_KEYS, sections[SECTION_ADDRESS]);
  moveKeys(rawKv, FISCAL_KEYS, sections[SECTION_FISCAL]);

  const regimes = sections[SECTION_FISCAL]["Régimen"];
  const dates = sections[SECTION_FISCAL]["Fecha de alta"];

  const regimenes: any[] = [];
  if (Array.isArray(regimes) && Array.isArray(dates)) {
    for (let i = 0; i < Math.min(regimes.length, dates.length); i++) {
      regimenes.push({
        Régimen: normalizeSpace(regimes[i] as string),
        "Fecha de alta": normalizeSpace(dates[i] as string),
      });
    }
  } else if (typeof regimes === "string" && typeof dates === "string") {
    regimenes.push({
      Régimen: normalizeSpace(regimes),
      "Fecha de alta": normalizeSpace(dates),
    });
  }

  if (regimenes.length > 0) {
    sections[SECTION_FISCAL].Régimen = regimenes;
    delete sections[SECTION_FISCAL]["Fecha de alta"];
  }

  for (const section of Object.values(sections)) {
    for (const [key, value] of Object.entries(section as any)) {
      if (typeof value === "string") {
        (section as any)[key] = stripSectionTitleSuffix(value);
      }
    }
  }

  return {
    provider: "SAT (Validador QR)",
    rfc,
    taxpayer_type: taxpayerType,
    sections,
  };
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function extractCsfDataFromPdf(pdfBuffer: Buffer) {
  // Step 1: Extract text from PDF
  const text = await extractTextFromPdf(pdfBuffer, 2);

  // Step 2: Build SAT URL from text
  const satUrl = tryBuildSatUrlFromText(text);
  if (!satUrl) {
    throw new Error(
      "Could not find SAT URL in PDF (idCIF/RFC missing)"
    );
  }

  // Step 3: Fetch SAT HTML
  const fetchResult = await fetchSatHtml(satUrl);

  // Step 4: Parse HTML
  const data = parseSatHtml(fetchResult.text);

  // Step 5: Add metadata
  const { place: creationPlace, date: creationDate } =
    extractCreationPlaceAndDate(text);
  const { daysOld, message: csfOkMessage } = validateCsfAge(creationDate);
  const idCif = extractIdCifFromUrl(satUrl);

  return {
    ...data,
    source_url: satUrl,
    idCIF: idCif,
    extracted_from_pdf: {
      filename: "",
      sat_url: satUrl,
      sat_url_source: "pdf_text" as const,
      creation_place: creationPlace,
      creation_date: creationDate?.toISOString() || null,
      days_old: daysOld,
      CSF_OK: csfOkMessage,
    },
  };
}
