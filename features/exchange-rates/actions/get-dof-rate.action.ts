'use server'

import { auth } from '@clerk/nextjs/server'
import { getDofRate } from '../services/exchange-rate.service'

/** For the invoice and payment forms: the DOF rate of a day, or null when it has to be typed. */
export async function getDofRateAction(currency: string, day: string) {
  const { userId } = await auth()
  if (!userId || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return { rate: null }
  return { rate: await getDofRate(currency, day) }
}
