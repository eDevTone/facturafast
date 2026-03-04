/**
 * CSF Extraction - Main Entry Point
 */

import {
  extractTextFromPdf,
  tryBuildSatUrlFromText,
  extractIdCifFromUrl,
  extractCreationPlaceAndDate,
  validateCsfAge,
} from "./pdf-parser";
import { fetchSatHtml } from "./sat-fetcher";
import { parseSatHtml } from "./html-parser";

export async function extractCsfDataFromPdf(pdfBuffer: Buffer) {
  // Step 1: Extract text from PDF
  const text = await extractTextFromPdf(pdfBuffer, 2);

  // Step 2: Build SAT URL from text
  const satUrl = tryBuildSatUrlFromText(text);
  if (!satUrl) {
    throw new Error("Could not find SAT URL in PDF (idCIF/RFC missing)");
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

// Re-export useful functions
export { parseSatHtml } from "./html-parser";
export { fetchSatHtml, validateSatUrl } from "./sat-fetcher";
export {
  extractTextFromPdf,
  extractIdCifFromUrl,
  tryBuildSatUrlFromText,
} from "./pdf-parser";
