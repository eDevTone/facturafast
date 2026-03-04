/**
 * pdf-parse v2 wrapper for Server Components
 * Module is externalized via next.config.ts serverExternalPackages
 */

import { PDFParse } from 'pdf-parse';

export async function parsePdf(
  buffer: Buffer,
  options?: { max?: number }
): Promise<{ text: string }> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText({ first: options?.max });
  await parser.destroy();
  return { text: result.text };
}
