'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createIssuingProfile } from '../services/fiscal-profile.service'
import type { CreateIssuingProfileInput } from '../types/fiscal-profile.types'

export async function createIssuingProfileAction(input: CreateIssuingProfileInput) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autorizado')

  const profile = await createIssuingProfile(userId, input)
  revalidatePath('/dashboard/fiscal-profiles')
  return profile
}
