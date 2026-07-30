import { useEffect, useState } from 'react'
import { getBoundariesForYear } from '../api/polities'
import type { PolityBoundaryCollection } from '../api/types'

interface UseBoundariesForYearResult {
  boundaries: PolityBoundaryCollection | null
  isLoading: boolean
  error: Error | null
}

/** Loads polity boundary GeoJSON for a given year via the `api/` seam. Resolves to `undefined` geojson until Phase 5 populates real data. */
export function useBoundariesForYear(year: number): UseBoundariesForYearResult {
  const [boundaries, setBoundaries] = useState<PolityBoundaryCollection | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    // Resetting loading/error here (rather than deriving them) is intentional:
    // it's what lets a change in `year` re-show a loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    setError(null)

    getBoundariesForYear(year)
      .then((result) => {
        if (!cancelled) setBoundaries(result)
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
  }, [year])

  return { boundaries, isLoading, error }
}
