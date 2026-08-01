import { useEffect, useState } from 'react'
import { getEventsForRange } from '../api/events'
import type { HistoricalEvent } from '../api/types'

interface UseEventsForRangeResult {
  events: HistoricalEvent[]
  isLoading: boolean
  error: Error | null
}

/**
 * Loads the events for a given ISO date range via the `api/` seam. Callers
 * that want to debounce requests while a user drags a control (e.g. the
 * range slider) should debounce `startIsoDate`/`endIsoDate` themselves
 * before passing them in -- this hook fetches whatever it's given,
 * immediately, the same way `useEventsForDate` did.
 */
export function useEventsForRange(
  startIsoDate: string,
  endIsoDate: string,
): UseEventsForRangeResult {
  const [events, setEvents] = useState<HistoricalEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    // Resetting loading/error here (rather than deriving them) is intentional:
    // it's what lets a change in the range re-show a loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    setError(null)

    getEventsForRange(startIsoDate, endIsoDate)
      .then((result) => {
        if (!cancelled) setEvents(result)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [startIsoDate, endIsoDate])

  return { events, isLoading, error }
}
