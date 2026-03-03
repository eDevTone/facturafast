/**
 * pdf-parse wrapper for CommonJS compatibility
 * Uses eval(require()) to bypass Next.js bundler
 */

export async function parsePdf(
  buffer: Buffer,
  options?: { max?: number }
): Promise<any> {
  const pdfParse = eval('require')('pdf-parse');
  return pdfParse(buffer, options);
}
