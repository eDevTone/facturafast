/**
 * pdf-parse v2 wrapper for Server Components
 * Module is externalized via next.config.ts serverExternalPackages
 */

/**
 * pdf-parse loads on first use, not with this module: a page's server actions load together, so if
 * it failed to load, every action on the page would fail, not only reading a constancia.
 * pdf-parse/worker goes first, as pdf-parse asks: pdf.js needs DOMMatrix, which Node lacks, and the
 * worker takes it from @napi-rs/canvas. Importing it is also what puts @napi-rs/canvas in the Vercel
 * function; without it pdf-parse fails to load with "DOMMatrix is not defined".
 */
async function loadPdfParse() {
  const { CanvasFactory } = await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  return { CanvasFactory, PDFParse };
}

export async function parsePdf(
  buffer: Buffer,
  options?: { max?: number }
): Promise<{ text: string }> {
  const { CanvasFactory, PDFParse } = await loadPdfParse();
  const parser = new PDFParse({ data: buffer, CanvasFactory });
  const result = await parser.getText({ first: options?.max });
  await parser.destroy();
  return { text: result.text };
}
