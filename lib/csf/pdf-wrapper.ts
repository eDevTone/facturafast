/**
 * pdf-parse wrapper for CommonJS compatibility
 * Externalized via next.config.mjs webpack config
 */

// Direct require works because pdf-parse is externalized
// @ts-ignore - CommonJS module
import pdfParse from 'pdf-parse';

export async function parsePdf(
  buffer: Buffer,
  options?: { max?: number }
): Promise<any> {
  return pdfParse(buffer, options);
}
