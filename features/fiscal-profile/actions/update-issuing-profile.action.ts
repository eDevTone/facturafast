'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { updateIssuingProfile, setDefaultIssuingProfile } from '../services/fiscal-profile.service'
import type { UpdateIssuingProfileInput } from '../types/fiscal-profile.types'

export async function updateIssuingProfileAction(id: string, input: UpdateIssuingProfileInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  const profile = await updateIssuingProfile(id, userId, input)
  revalidatePath('/dashboard/fiscal-profiles')
  return profile
}

export async function setDefaultIssuingProfileAction(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  await setDefaultIssuingProfile(id, userId)
  revalidatePath('/dashboard/fiscal-profiles')
}
