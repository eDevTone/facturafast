import { eq, and, ilike, isNull } from 'drizzle-orm'
import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import type { CreateClientInput, Client } from '../types/client.types'

/**
 * Get all clients for a user (excluding soft-deleted)
 */
export async function getClients(userId: string): Promise<Client[]> {
  return db.query.clients.findMany({
    where: and(
      eq(clients.userId, userId),
      isNull(clients.deletedAt)
    ),
    orderBy: (clients, { desc }) => desc(clients.createdAt)
  })
}

/**
 * Get client by ID (excluding soft-deleted)
 */
export async function getClientById(
  id: string,
  userId: string
): Promise<Client | undefined> {
  return db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.userId, userId),
      isNull(clients.deletedAt)
    )
  })
}

/**
 * Get client by RFC (excluding soft-deleted)
 */
export async function getClientByRFC(
  rfc: string,
  userId: string
): Promise<Client | undefined> {
  return db.query.clients.findFirst({
    where: and(
      eq(clients.rfc, rfc.toUpperCase()),
      eq(clients.userId, userId),
      isNull(clients.deletedAt)
    )
  })
}

/**
 * Search clients by name or RFC (excluding soft-deleted)
 */
export async function searchClients(
  userId: string,
  query: string
): Promise<Client[]> {
  return db.query.clients.findMany({
    where: and(
      eq(clients.userId, userId),
      isNull(clients.deletedAt),
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
  // Check if RFC already exists (excluding soft-deleted)
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
      rfc: data.rfc ? data.rfc.toUpperCase() : undefined,
      updatedAt: new Date(),
    })
    .where(and(
      eq(clients.id, id),
      isNull(clients.deletedAt)
    ))
    .returning()

  return updated
}

/**
 * Soft delete client
 */
export async function deleteClient(id: string, userId: string) {
  const client = await getClientById(id, userId)
  if (!client) {
    throw new Error('Client not found')
  }

  // Soft delete: set deletedAt timestamp
  await db
    .update(clients)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(
      eq(clients.id, id),
      eq(clients.userId, userId)
    ))

  return { success: true }
}
