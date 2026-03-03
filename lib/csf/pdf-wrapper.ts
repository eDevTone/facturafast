/**
 * pdf-parse wrapper for Server Components
 * Uses dynamic require in Node.js runtime
 */

import { createRequire } from 'node:module';

// Create require function for ESM context
const require = createRequire(import.meta.url);

export async function parsePdf(
  buffer: Buffer,
  options?: { max?: number }
): Promise<any> {
  // Use require created from createRequire
  const pdfParse = require('pdf-parse');
  return pdfParse(buffer, options);
}
