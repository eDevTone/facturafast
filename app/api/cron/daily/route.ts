import { runDailyJobs } from '@features/recurring/services/daily-jobs.service'
import { todayInMexico } from '@features/stamping/utils/cfdi-xml'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * The daily cron (Vercel Cron, `vercel.json`): recurring invoices, automatic payment reminders and
 * the notices of CSDs about to expire.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`; any other scheduler can call it the same way.
 * Outside production, `?today=YYYY-MM-DD` runs it as if it were another day.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const simulated = process.env.NODE_ENV !== 'production' ? new URL(request.url).searchParams.get('today') : null
  const today = simulated && DAY_PATTERN.test(simulated) ? simulated : todayInMexico()

  return Response.json(await runDailyJobs(today))
}
