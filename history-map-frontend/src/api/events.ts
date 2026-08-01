import { apiGet } from './client'
import type { HistoricalEvent } from './types'

/** Returns every event whose date span overlaps [startIsoDate, endIsoDate]. */
export async function getEventsForRange(
  startIsoDate: string,
  endIsoDate: string,
): Promise<HistoricalEvent[]> {
  return apiGet<HistoricalEvent[]>(
    `/events?start_date=${startIsoDate}&end_date=${endIsoDate}`,
  )
}

/** Returns a single event's own canonical record by id. */
export async function getEventById(id: string): Promise<HistoricalEvent> {
  return apiGet<HistoricalEvent>(`/events/${id}`)
}

/**
 * Returns everything connected to `id` via the backend's precomputed
 * CONCURRENT_WITH relationship — the "meanwhile, elsewhere" cluster for one
 * focused event, independent of whatever date range is currently browsed.
 */
export async function getConcurrentEvents(
  id: string,
): Promise<HistoricalEvent[]> {
  return apiGet<HistoricalEvent[]>(`/events/${id}/concurrent`)
}
