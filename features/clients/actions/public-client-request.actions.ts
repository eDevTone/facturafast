'use server'

import { extractCsfDataFromPdf } from '@/lib/csf'
import { completeClientRequest, noteRequestAttempt, resolveClientRequest, type ClientDataInput } from '../services/client-request.service'
import type { CsfPdfResponse } from '../types/csf.types'

/**
 * The page a client opens from "Pedir datos a un cliente", without a session: every call checks
 * the token again and counts against the link's limit of uses.
 */

const GONE = 'Este link ya no funciona. Pídele uno nuevo a quien te lo mandó.'

/** Reads the client's Constancia de Situación Fiscal to fill the form (optional). */
export async function extractCsfForRequestAction(token: string, formData: FormData) {
  const resolved = await resolveClientRequest(token)
  if (!resolved) return { success: false as const, error: GONE }

  const file = formData.get('file') as File | null
  if (!file || file.type !== 'application/pdf') {
    return { success: false as const, error: 'Se requiere un archivo PDF válido' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false as const, error: 'El archivo debe ser menor a 10MB' }
  }

  await noteRequestAttempt(resolved.request.id)
  try {
    const result = await extractCsfDataFromPdf(Buffer.from(await file.arrayBuffer()))
    const data = { ...result, extracted_from_pdf: { ...result.extracted_from_pdf, filename: file.name } } as unknown as CsfPdfResponse
    return { success: true as const, data }
  } catch {
    return { success: false as const, error: 'No pudimos leer la constancia. Escribe tus datos a mano.' }
  }
}

/** Saves what the client typed. */
export async function submitClientDataAction(token: string, input: ClientDataInput) {
  try {
    return { success: true as const, ...(await completeClientRequest(token, input)) }
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'No pudimos guardar tus datos.' }
  }
}
