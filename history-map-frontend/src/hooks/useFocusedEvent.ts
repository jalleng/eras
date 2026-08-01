import { useEffect, useState } from 'react'
import { getEventById } from '../api/events'
import type { HistoricalEvent } from '../api/types'

interface UseFocusedEventResult {
  focusedEvent: HistoricalEvent | null
  isLoading: boolean
  error: Error | null
}

/**
 * Loads the canonical record for whichever event the user has clicked into,
 * by id, independent of the currently browsed range. Fetching by id (rather
 * than reusing whatever's in the range-fetched event list) means the
 * focused event's own date span stays known even if the user then drags the
 * range elsewhere -- which is what lets the app decide whether the focus
 * should be cleared, rather than just losing track of it.
 */
export function useFocusedEvent(
  focusedEventId: string | null,
): UseFocusedEventResult {
  const [focusedEvent, setFocusedEvent] = useState<HistoricalEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (focusedEventId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusedEvent(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    getEventById(focusedEventId)
      .then((result) => {
        if (!cancelled) setFocusedEvent(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setFocusedEvent(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [focusedEventId])

  return { focusedEvent, isLoading, error }
}
