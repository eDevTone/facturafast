'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { deleteIssuingProfile } from '../services/fiscal-profile.service'

export async function deleteIssuingProfileAction(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  await deleteIssuingProfile(id, userId)
  revalidatePath('/dashboard/fiscal-profiles')
}
