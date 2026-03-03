/**
 * PDF Parsing Functions
 */

import { parsePdf } from "./pdf-wrapper";
import {
  RFC_REGEX,
  IDCIF_REGEX,
  IDCIF_FROM_D3_REGEX,
  LUGAR_FECHA_REGEX,
  SAT_QR_BASE_URL,
  SPANISH_MONTHS,
  CSF_MAX_AGE_DAYS,
} from "./constants";
import { normalizeSpace } from "./utils";

export async function extractTextFromPdf(
  pdfBuffer: Buffer,
  maxPages = 2
): Promise<string> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error("Empty PDF buffer");
  }

  const data = await parsePdf(pdfBuffer, { max: maxPages });

  if (!data.text || data.text.trim().length === 0) {
    throw new Error("PDF has no text content");
  }

  return data.text;
}

export function tryBuildSatUrlFromText(text: string): string | null {
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

export function extractIdCifFromUrl(satUrl: string): string | null {
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

export function extractCreationPlaceAndDate(text: string) {
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

export function validateCsfAge(creationDate: Date | null) {
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
