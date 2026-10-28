import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Asks the SAT about pending cancellations once the page shows, and refreshes the page when the
 * SAT resolved one. The page renders with what is stored, so it never waits for the SAT.
 *
 * @param refresh - Server call that asks the SAT and saves the answer; resolves to `true` when
 *   something changed. Keep it stable (module scope or `useCallback`), or it runs on every render.
 * @param enabled - Only ask while something is pending.
 * @param lastCheckedAt - When the SAT was last asked; a newer answer than `minAgeMs` is kept.
 * @param minAgeMs - How old the last answer must be to ask again (default: one minute).
 */
export function useCancellationRefresh(
  refresh: () => Promise<boolean>,
  enabled: boolean,
  lastCheckedAt?: Date | string | null,
  minAgeMs = 60_000,
) {
  const router = useRouter()
  const lastChecked = lastCheckedAt ? new Date(lastCheckedAt).getTime() : null

  useEffect(() => {
    if (!enabled) return
    if (lastChecked !== null && Date.now() - lastChecked < minAgeMs) return

    let active = true
    refresh()
      .then((changed) => {
        if (active && changed) router.refresh()
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [enabled, lastChecked, minAgeMs, refresh, router])
}
