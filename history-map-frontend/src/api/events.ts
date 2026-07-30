import { curatedDates } from '../data/curatedDates'
import type { CuratedDateEntry, HistoricalEvent } from './types'

/**
 * Returns every curated date, in ascending chronological order. Phase 2 will
 * replace the body of this function with a fetch to a real endpoint (e.g.
 * `apiGet<CuratedDateEntry[]>('/dates')`) — callers won't need to change.
 */
export async function getAvailableDates(): Promise<CuratedDateEntry[]> {
  return [...curatedDates].sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

/**
 * Returns the events for a specific ISO date, or an empty array if no
 * curated data exists for that date.
 */
export async function getEventsForDate(
  isoDate: string,
): Promise<HistoricalEvent[]> {
  const entry = curatedDates.find((date) => date.isoDate === isoDate)
  return entry ? entry.events : []
}
