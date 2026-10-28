import { eq, and, ilike, isNull, ne } from 'drizzle-orm'
import { db } from '@database/client'
import { clients } from '@database/schemas/clients.schema'
import { countries } from '@database/schemas/sat-catalogs.schema'
import { assertTaxRegimeFitsRfc } from '@shared/services/sat-catalog.service'
import type { CreateClientInput, Client } from '../types/client.types'
import {
  FOREIGN_CFDI_USAGE,
  FOREIGN_RFC,
  FOREIGN_TAX_REGIME,
  foreignTaxIdMatches,
  GENERIC_RFCS,
  normalizeForeignTaxId,
} from '../utils/foreign-client'

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

/** Column values of a client: a client abroad takes the generic RFC, 616 and S01, and no CP. */
function clientValues(data: CreateClientInput) {
  const contact = {
    businessName: data.businessName.trim(),
    email: data.email || null,
    phone: data.phone || null,
    paymentTermsDays: data.paymentTermsDays ?? null,
  }
  if (data.isForeign) {
    return {
      ...contact,
      rfc: FOREIGN_RFC,
      postalCode: null,
      taxRegime: FOREIGN_TAX_REGIME,
      cfdiUsage: FOREIGN_CFDI_USAGE,
      country: data.country!,
      foreignTaxId: data.foreignTaxId ? normalizeForeignTaxId(data.foreignTaxId) || null : null,
      ivaRate: data.ivaRate!,
    }
  }
  return {
    ...contact,
    rfc: data.rfc.toUpperCase(),
    postalCode: data.postalCode!,
    taxRegime: data.taxRegime || null,
    cfdiUsage: data.cfdiUsage || 'G03',
    country: null,
    foreignTaxId: null,
    ivaRate: null,
  }
}

/** The tax id of a client abroad must follow the pattern c_Pais gives its country (CFDI40156). */
async function assertForeignTaxId(values: ReturnType<typeof clientValues>) {
  if (!values.country || !values.foreignTaxId) return
  const [country] = await db.select().from(countries).where(eq(countries.code, values.country)).limit(1)
  if (!country) throw new Error('Elige un país del catálogo del SAT.')
  if (!foreignTaxIdMatches(values.foreignTaxId, country.taxIdFormat)) {
    throw new Error(country.taxIdFormat === '[0-9]{9}'
      ? 'El número fiscal de ese país lleva 9 dígitos, sin guiones.'
      : `El número fiscal no tiene el formato que el SAT pide para ese país (${country.taxIdFormat}).`)
  }
}

/** A Mexican client's régimen must fit its RFC; the SAT rejects the stamp otherwise. */
async function assertRegimeFitsRfc(values: ReturnType<typeof clientValues>) {
  if (values.taxRegime && values.rfc !== FOREIGN_RFC) await assertTaxRegimeFitsRfc(values.taxRegime, values.rfc)
}

/**
 * One client per RFC. Generic RFCs are shared, so a client abroad is told apart by its country
 * and tax id.
 */
async function assertNotDuplicate(userId: string, values: ReturnType<typeof clientValues>, exceptId?: string) {
  const notThis = exceptId ? ne(clients.id, exceptId) : undefined
  if (values.rfc === FOREIGN_RFC) {
    if (!values.foreignTaxId) return
    const duplicate = await db.query.clients.findFirst({
      where: and(
        eq(clients.userId, userId),
        isNull(clients.deletedAt),
        eq(clients.rfc, FOREIGN_RFC),
        eq(clients.country, values.country!),
        eq(clients.foreignTaxId, values.foreignTaxId),
        notThis,
      ),
    })
    if (duplicate) throw new Error(`Ya tienes a ${duplicate.businessName} con ese número fiscal.`)
    return
  }
  if (GENERIC_RFCS.includes(values.rfc)) return
  const duplicate = await db.query.clients.findFirst({
    where: and(eq(clients.userId, userId), isNull(clients.deletedAt), eq(clients.rfc, values.rfc), notThis),
  })
  if (duplicate) throw new Error(`Ya tienes un cliente con el RFC ${values.rfc}: ${duplicate.businessName}.`)
}

/** The user's client with that RFC, if any (a generic RFC is shared, so it is never looked up). */
export async function getClientByRfc(userId: string, rfc: string): Promise<Client | undefined> {
  const value = rfc.trim().toUpperCase()
  if (GENERIC_RFCS.includes(value)) return undefined
  return db.query.clients.findFirst({
    where: and(eq(clients.userId, userId), eq(clients.rfc, value), isNull(clients.deletedAt)),
  })
}

/**
 * Create a new client
 */
export async function createClient(
  userId: string,
  data: CreateClientInput
): Promise<Client> {
  const values = clientValues(data)
  await assertForeignTaxId(values)
  await assertRegimeFitsRfc(values)
  await assertNotDuplicate(userId, values)

  const [client] = await db
    .insert(clients)
    .values({ userId, ...values })
    .returning()

  return client
}

/**
 * Update client
 */
export async function updateClient(
  id: string,
  userId: string,
  data: CreateClientInput
): Promise<Client> {
  const client = await getClientById(id, userId)
  if (!client) {
    throw new Error('Cliente no encontrado')
  }

  const values = clientValues(data)
  await assertForeignTaxId(values)
  await assertRegimeFitsRfc(values)
  await assertNotDuplicate(userId, values, id)

  const [updated] = await db
    .update(clients)
    .set({ ...values, updatedAt: new Date() })
    .where(and(
      eq(clients.id, id),
      eq(clients.userId, userId),
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
