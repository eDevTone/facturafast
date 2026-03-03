/**
 * pdf-parse wrapper for CommonJS compatibility
 * This file uses require() to properly load the CommonJS module
 */

// Use dynamic require for CommonJS module
export async function parsePdf(buffer: Buffer, options?: { max?: number }): Promise<any> {
  // Use eval to avoid bundler from trying to transform require
  const pdfParse = eval('require')('pdf-parse');
  return pdfParse(buffer, options);
}
