/**
 * pdf-parse wrapper for Server Components
 * Module is externalized via next.config.ts
 */

// @ts-ignore - CommonJS module externalized
import pdfParse from 'pdf-parse';

export async function parsePdf(
  buffer: Buffer,
  options?: { max?: number }
): Promise<any> {
  return pdfParse(buffer, options);
}
