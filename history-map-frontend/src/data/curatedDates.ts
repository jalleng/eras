import type { CuratedDateEntry } from '../api/types'

/**
 * The slider's navigation index: which dates to feature as stops, and their
 * display labels. This is a frontend UI concern (which historical moments
 * to showcase), not domain data — the events themselves now live in the
 * Phase 2 backend (Neo4j, seeded from history-map-backend/ingestion/curated_events.py)
 * and are fetched live via `getEventsForDate`, so they aren't duplicated here.
 */
export const curatedDates: CuratedDateEntry[] = [
  { isoDate: '1776-07-04', label: 'Declaration of Independence' },
  { isoDate: '1941-12-07', label: 'Opening of the Pacific War' },
  { isoDate: '1962-10-27', label: 'Black Saturday: two Cold War crises collide' },
]
