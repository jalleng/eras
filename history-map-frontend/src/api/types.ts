import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'

/**
 * Shared data-layer types. `api/events.ts` and `api/polities.ts` return
 * exactly this shape whether the data comes from `data/curatedDates.ts`
 * (Phase 1) or the FastAPI + Neo4j backend (Phase 2, current). Components
 * should only ever depend on these types, not on where the data physically
 * comes from.
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
  isoDate: string
  latitude: number
  longitude: number
  region: Region
  /** Human-readable place name shown alongside the region label. */
  location: string
}

export interface CuratedDateEntry {
  /** ISO 8601 date (YYYY-MM-DD) used as the slider's stop and event lookup key. */
  isoDate: string
  /** Short label for the slider, e.g. "Declaration of Independence". */
  label: string
}

/** GeoJSON FeatureCollection of polity/boundary shapes for a given year (Phase 5, not yet populated). */
export interface PolityBoundaryCollection {
  year: number
  geojson: FeatureCollection<Geometry, GeoJsonProperties> | undefined
}
