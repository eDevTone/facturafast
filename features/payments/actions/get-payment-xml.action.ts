'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@database/client'
import { payments } from '@database/schemas/payments.schema'
import { and, eq } from 'drizzle-orm'

/** The stamped XML kept in the database, for when the copy in R2 is not available. */
export async function getPaymentXmlAction(paymentId: string) {
  const { userId } = await auth()

  if (!userId) {
    return { xml: null, error: 'No autorizado' }
  }

  const [row] = await db
    .select({ xml: payments.xmlContent, status: payments.status })
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
    .limit(1)

  if (!row || row.status === 'en_timbrado') return { xml: null, error: 'El complemento aún no está timbrado' }
  return { xml: row.xml }
}
