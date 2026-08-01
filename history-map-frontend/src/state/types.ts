import type { ProjectionType } from '../components/map/useD3Projection'

export interface MapState {
  /** ISO 8601 date (YYYY-MM-DD) — the browsing range's start. */
  rangeStart: string
  /** ISO 8601 date (YYYY-MM-DD) — the browsing range's end. */
  rangeEnd: string
  projectionType: ProjectionType
  hoveredEventId: string | null
  /** The event the user has clicked into, independent of the browsing range. */
  focusedEventId: string | null
}

export type MapAction =
  | { type: 'SET_RANGE'; rangeStart: string; rangeEnd: string }
  | { type: 'SET_PROJECTION'; projectionType: ProjectionType }
  | { type: 'HOVER_EVENT'; id: string | null }
  | { type: 'FOCUS_EVENT'; id: string | null }
