import { apiGet } from './client'
import { curatedDates } from '../data/curatedDates'
import type { CuratedDateEntry, HistoricalEvent } from './types'

/**
 * Returns every curated date, in ascending chronological order. This is the
 * frontend's own navigation index (which dates to feature as slider stops) —
 * the backend has no "list of curated dates" endpoint, since which moments
 * to showcase is a frontend/UX concern, not domain data.
 */
export async function getAvailableDates(): Promise<CuratedDateEntry[]> {
  return [...curatedDates].sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}

/**
 * Returns the events for a specific ISO date, plus everything connected to
 * them via the backend's precomputed CONCURRENT_WITH relationship.
 *
 * This two-step fetch matters: a curated "moment" can span several days
 * (e.g. the July 4, 1776 cluster runs from June 28 to July 12 — Cook's
 * voyage and the Sullivan's Island battle aren't ON July 4), so a plain
 * `start_date=end_date=isoDate` query only returns events whose own date
 * matches exactly. Pulling in each match's `/concurrent` events reassembles
 * the full curated cluster the same way Phase 1's bundled data did.
 */
export async function getEventsForDate(
  isoDate: string,
): Promise<HistoricalEvent[]> {
  const anchors = await apiGet<HistoricalEvent[]>(
    `/events?start_date=${isoDate}&end_date=${isoDate}`,
  )

  const concurrentLists = await Promise.all(
    anchors.map((event) =>
      apiGet<HistoricalEvent[]>(`/events/${event.id}/concurrent`),
    ),
  )

  const eventsById = new Map<string, HistoricalEvent>()
  for (const event of anchors) eventsById.set(event.id, event)
  for (const concurrentEvents of concurrentLists) {
    for (const event of concurrentEvents) eventsById.set(event.id, event)
  }

  return [...eventsById.values()].sort((a, b) =>
    a.dateStart.localeCompare(b.dateStart),
  )
}
