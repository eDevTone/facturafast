import { eq, and, ilike } from 'drizzle-orm'
import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import type { CreateClientInput, Client } from '../types/client.types'

/**
 * Get all clients for a user
 */
export async function getClients(userId: string): Promise<Client[]> {
  return db.query.clients.findMany({
    where: eq(clients.userId, userId),
    orderBy: (clients, { desc }) => desc(clients.createdAt)
  })
}

/**
 * Get client by ID
 */
export async function getClientById(
  id: string,
  userId: string
): Promise<Client | undefined> {
  return db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.userId, userId)
    )
  })
}

/**
 * Get client by RFC
 */
export async function getClientByRFC(
  rfc: string,
  userId: string
): Promise<Client | undefined> {
  return db.query.clients.findFirst({
    where: and(
      eq(clients.rfc, rfc.toUpperCase()),
      eq(clients.userId, userId)
    )
  })
}

/**
 * Search clients by name or RFC
 */
export async function searchClients(
  userId: string,
  query: string
): Promise<Client[]> {
  return db.query.clients.findMany({
    where: and(
      eq(clients.userId, userId),
      ilike(clients.businessName, `%${query}%`)
    ),
    limit: 10
  })
}

/**
 * Create a new client
 */
export async function createClient(
  userId: string,
  data: CreateClientInput
): Promise<Client> {
  // Check if RFC already exists
  const existing = await getClientByRFC(data.rfc, userId)
  if (existing) {
    throw new Error(`Client with RFC ${data.rfc} already exists`)
  }

  const [client] = await db
    .insert(clients)
    .values({
      userId,
      rfc: data.rfc.toUpperCase(),
      businessName: data.businessName,
      email: data.email || null,
      phone: data.phone || null,
      postalCode: data.postalCode,
      taxRegime: data.taxRegime || null,
      cfdiUsage: data.cfdiUsage || 'P01'
    })
    .returning()

  return client
}

/**
 * Update client
 */
export async function updateClient(
  id: string,
  userId: string,
  data: Partial<CreateClientInput>
): Promise<Client> {
  const client = await getClientById(id, userId)
  if (!client) {
    throw new Error('Client not found')
  }

  const [updated] = await db
    .update(clients)
    .set({
      ...data,
      rfc: data.rfc ? data.rfc.toUpperCase() : undefined
    })
    .where(eq(clients.id, id))
    .returning()

  return updated
}

/**
 * Delete client
 */
export async function deleteClient(id: string, userId: string) {
  const client = await getClientById(id, userId)
  if (!client) {
    throw new Error('Client not found')
  }

  // TODO: Check if client has invoices before deleting

  await db.delete(clients).where(eq(clients.id, id))

  return { success: true }
}
