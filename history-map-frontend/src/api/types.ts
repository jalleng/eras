import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'

/**
 * Shared data-layer types for events served by the FastAPI + Neo4j backend
 * (`api/events.ts`, `api/polities.ts`). Components should only ever depend
 * on these types, not on the backend's own request/response shapes.
 */

export type Region =
  | 'North America'
  | 'South America'
  | 'Europe'
  | 'Africa'
  | 'Asia'
  | 'Oceania'
  | 'Antarctica'

export interface HistoricalEvent {
  id: string
  title: string
  description: string
  /** ISO 8601 date (YYYY-MM-DD). Always CE/Gregorian for this dataset. */
  dateStart: string
  /** ISO 8601 date (YYYY-MM-DD), or null for single-day events. */
  dateEnd: string | null
  latitude: number
  longitude: number
  region: Region
  /** Human-readable place name shown alongside the region label. */
  location: string
  wikipediaUrl: string | null
}

/** A hand-picked quick-jump window for the range slider, e.g. "July 1776". */
export interface FeaturedRange {
  /** ISO 8601 date (YYYY-MM-DD) — the window's start. */
  rangeStart: string
  /** ISO 8601 date (YYYY-MM-DD) — the window's end. */
  rangeEnd: string
  /** Short label for the quick-jump button, e.g. "Declaration of Independence". */
  label: string
}

/** GeoJSON FeatureCollection of polity/boundary shapes for a given year (Phase 5, not yet populated). */
export interface PolityBoundaryCollection {
  year: number
  geojson: FeatureCollection<Geometry, GeoJsonProperties> | undefined
}
