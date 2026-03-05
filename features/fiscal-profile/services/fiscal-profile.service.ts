import { eq } from 'drizzle-orm'
import { db } from '@database/client'
import { userFiscalProfile } from '@database/schemas/fiscal-profile'

export async function getFiscalProfile(userId: string) {
  return db.query.userFiscalProfile.findFirst({
    where: eq(userFiscalProfile.userId, userId),
  })
}
