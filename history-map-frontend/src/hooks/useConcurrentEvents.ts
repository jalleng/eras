import { useEffect, useState } from 'react'
import { getConcurrentEvents } from '../api/events'
import type { HistoricalEvent } from '../api/types'

interface UseConcurrentEventsResult {
  concurrentEvents: HistoricalEvent[]
  isLoading: boolean
  error: Error | null
}

/**
 * Loads the "meanwhile, elsewhere" cluster for whichever event the user has
 * clicked into -- fetched once per focus change via the backend's
 * precomputed CONCURRENT_WITH relationship, not derived from (or scoped to)
 * whatever date range happens to be currently browsed.
 */
export function useConcurrentEvents(
  focusedEventId: string | null,
): UseConcurrentEventsResult {
  const [concurrentEvents, setConcurrentEvents] = useState<HistoricalEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (focusedEventId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConcurrentEvents([])
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getConcurrentEvents(focusedEventId)
      .then((result) => {
        if (!cancelled) setConcurrentEvents(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setConcurrentEvents([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [focusedEventId])

  return { concurrentEvents, isLoading, error }
}
