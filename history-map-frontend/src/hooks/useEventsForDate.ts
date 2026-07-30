import { useEffect, useState } from 'react'
import { getEventsForDate } from '../api/events'
import type { HistoricalEvent } from '../api/types'

interface UseEventsForDateResult {
  events: HistoricalEvent[]
  isLoading: boolean
  error: Error | null
}

/** Loads the events for a given ISO date via the `api/` seam. */
export function useEventsForDate(isoDate: string): UseEventsForDateResult {
  const [events, setEvents] = useState<HistoricalEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    // Resetting loading/error here (rather than deriving them) is intentional:
    // it's what lets a change in `isoDate` re-show a loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    setError(null)

    getEventsForDate(isoDate)
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
  }, [isoDate])

  return { events, isLoading, error }
}
