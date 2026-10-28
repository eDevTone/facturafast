import { db } from '@database/client'
import { clientDataRequests } from '@database/schemas/client-data-requests.schema'
import { issuingProfiles } from '@database/schemas/issuing-profiles.schema'
import { getDefaultIssuingProfile, getIssuingProfileById } from '@features/fiscal-profile/services/fiscal-profile.service'
import { sendClientDataReceivedEmail } from '@features/notifications/services/email.service'
import { appUrl } from '@shared/utils/app-url'
import { hashShareToken, isShareToken, newShareToken, revealShareToken } from '@shared/utils/share-token'
import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { createClientFormSchema, type ClientFormData } from '../schemas/client-form.schema'
import type { Client } from '../types/client.types'
import { isForeignClient } from '../utils/foreign-client'
import { createClient, getClientById, getClientByRfc, updateClient } from './client.service'

/** A link works for this long. */
const REQUEST_DAYS = 30

/** Constancias read plus forms sent through one link; past this it stops working. */
const MAX_ATTEMPTS = 20

/** What the client types on the page: a client in México. */
export interface ClientDataInput {
  rfc: string
  businessName: string
  taxRegime: string
  postalCode: string
  cfdiUsage: string
  email: string
  phone?: string
}

/** A pending link as the client list shows it. */
export interface PendingClientRequest {
  id: string
  label: string
  clientId: string | null
  url: string
  createdAt: Date
  expiresAt: Date
}

function requestUrl(token: string): string {
  return appUrl(`/datos/${token}`)
}

/**
 * "Pedir datos a un cliente": a link for a new client (`label` names it) or for one the user
 * already has (`clientId`), presented with the name of the user's default business.
 */
export async function createClientRequest(userId: string, input: { label?: string; clientId?: string }) {
  let label = input.label?.trim() ?? ''
  if (input.clientId) {
    const client = await getClientById(input.clientId, userId)
    if (!client) throw new Error('Cliente no encontrado')
    if (isForeignClient(client)) throw new Error('El link es para clientes en México; uno del extranjero no tiene RFC.')
    label = client.businessName
  }
  if (!label) throw new Error('Escribe cómo identificas a este cliente.')

  const profile = await getDefaultIssuingProfile(userId)
  if (!profile) throw new Error('Primero registra tu perfil fiscal.')

  const { token, tokenHash, tokenEncrypted } = newShareToken()
  const [request] = await db
    .insert(clientDataRequests)
    .values({
      userId,
      issuingProfileId: profile.id,
      clientId: input.clientId ?? null,
      label: label.slice(0, 120),
      tokenHash,
      tokenEncrypted,
      expiresAt: new Date(Date.now() + REQUEST_DAYS * 86_400_000),
    })
    .returning()
  return { id: request.id, label: request.label, url: requestUrl(token), expiresAt: request.expiresAt }
}

/** Links still waiting for their client, newest first. */
export async function getPendingClientRequests(userId: string): Promise<PendingClientRequest[]> {
  const rows = await db
    .select()
    .from(clientDataRequests)
    .where(and(
      eq(clientDataRequests.userId, userId),
      eq(clientDataRequests.status, 'pendiente'),
      gt(clientDataRequests.expiresAt, new Date()),
    ))
    .orderBy(desc(clientDataRequests.createdAt))
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    clientId: row.clientId,
    url: requestUrl(revealShareToken(row.tokenEncrypted)),
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }))
}

/** "Cancelar": the link stops working. */
export async function cancelClientRequest(userId: string, id: string) {
  await db
    .update(clientDataRequests)
    .set({ status: 'cancelada' })
    .where(and(eq(clientDataRequests.id, id), eq(clientDataRequests.userId, userId), eq(clientDataRequests.status, 'pendiente')))
}

/**
 * The pending request behind a token, with the name of the business that asks. Expired,
 * completed, cancelled and made-up links all look the same: null.
 */
export async function resolveClientRequest(token: string) {
  if (!isShareToken(token)) return null
  const [row] = await db
    .select({ request: clientDataRequests, businessName: issuingProfiles.businessName })
    .from(clientDataRequests)
    .innerJoin(issuingProfiles, eq(issuingProfiles.id, clientDataRequests.issuingProfileId))
    .where(and(
      eq(clientDataRequests.tokenHash, hashShareToken(token)),
      eq(clientDataRequests.status, 'pendiente'),
      gt(clientDataRequests.expiresAt, new Date()),
    ))
    .limit(1)
  if (!row || row.request.attempts >= MAX_ATTEMPTS) return null
  return row
}

/** Counts a use of the link (a constancia read or a form sent). */
export async function noteRequestAttempt(requestId: string) {
  await db
    .update(clientDataRequests)
    .set({ attempts: sql`${clientDataRequests.attempts} + 1` })
    .where(eq(clientDataRequests.id, requestId))
}

/**
 * The client sends their data. It is checked like the client form (régimen and RFC included) and
 * saved on the client the link was for; for a new client, on the one that already has that RFC,
 * or as a new client. The user's own fields (días de crédito) are kept, and the user gets an email.
 */
export async function completeClientRequest(token: string, input: ClientDataInput) {
  const resolved = await resolveClientRequest(token)
  if (!resolved) throw new Error('Este link ya no funciona. Pídele uno nuevo a quien te lo mandó.')
  const { request } = resolved
  await noteRequestAttempt(request.id)

  const parsed = createClientFormSchema.safeParse({ ...input, isForeign: false })
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Revisa tus datos.')
  const data: ClientFormData = parsed.data

  const existing: Client | undefined = request.clientId
    ? await getClientById(request.clientId, request.userId)
    : await getClientByRfc(request.userId, data.rfc)

  const client = existing
    ? await updateClient(existing.id, request.userId, {
        ...data,
        phone: data.phone || existing.phone || undefined,
        paymentTermsDays: existing.paymentTermsDays,
      })
    : await createClient(request.userId, data)

  await db
    .update(clientDataRequests)
    .set({ status: 'completada', completedAt: new Date(), clientId: client.id })
    .where(eq(clientDataRequests.id, request.id))

  // The user hears about it; a failed email does not undo what the client sent.
  try {
    const profile = await getIssuingProfileById(request.issuingProfileId, request.userId)
    if (profile?.email) {
      await sendClientDataReceivedEmail({
        to: profile.email,
        clientName: client.businessName,
        rfc: client.rfc,
        updated: !!existing,
        clientUrl: appUrl('/clients'),
        invoiceUrl: appUrl(`/invoices/new?clientId=${client.id}`),
      })
    }
  } catch (error) {
    console.error('[ClientRequest] Could not email the user:', error instanceof Error ? error.message : error)
  }

  return { businessName: client.businessName }
}
