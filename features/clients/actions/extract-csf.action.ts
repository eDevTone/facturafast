'use server'

import { auth } from '@clerk/nextjs/server'
import { extractCsfDataFromPdf } from "@/lib/csf";
import type { CsfPdfResponse } from "../types/csf.types";

/**
 * Server Action: Extract CSF data from a PDF file
 */
export async function extractCsfAction(formData: FormData) {
  // Without this, anyone could use the app to read PDFs and query the SAT.
  const { userId } = await auth()
  if (!userId) {
    return { success: false as const, error: 'No autorizado' };
  }

  const file = formData.get('file') as File | null;

  if (!file || file.type !== 'application/pdf') {
    return { success: false as const, error: 'Se requiere un archivo PDF válido' };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { success: false as const, error: 'El archivo debe ser menor a 10MB' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await extractCsfDataFromPdf(buffer);

    // The parser returns the SAT page as loose key/value sections; CsfPdfResponse names the ones we read.
    const csfData = {
      ...result,
      extracted_from_pdf: {
        ...result.extracted_from_pdf,
        filename: file.name,
      },
    } as unknown as CsfPdfResponse;

    return { success: true as const, data: csfData };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Error al extraer datos del CSF',
    };
  }
}
