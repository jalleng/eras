import type { PolityBoundaryCollection } from './types'

/**
 * Returns polity/boundary GeoJSON for a given year. No boundary data exists
 * yet (that's Phase 5) — this always resolves to `undefined` geojson today,
 * but keeps the real call shape so `BoundaryLayer` and Phase 2's backend
 * integration don't require call-site changes later.
 */
export async function getBoundariesForYear(
  year: number,
): Promise<PolityBoundaryCollection> {
  return { year, geojson: undefined }
}
