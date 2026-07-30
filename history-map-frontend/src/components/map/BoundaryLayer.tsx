import type { GeoPath, GeoPermissibleObjects } from 'd3-geo'
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'

interface BoundaryLayerProps {
  geojson: FeatureCollection<Geometry, GeoJsonProperties> | undefined
  path: GeoPath
}

/**
 * Renders polity/boundary shapes for the current year. Polity boundary data
 * doesn't exist yet (Phase 5 populates it via `api/polities.ts`), so this
 * renders nothing when `geojson` is undefined or empty — a deliberate no-op,
 * not a placeholder to fill in later.
 */
export function BoundaryLayer({ geojson, path }: BoundaryLayerProps) {
  if (!geojson || geojson.features.length === 0) {
    return null
  }

  return (
    <g className="pointer-events-none" data-testid="boundary-layer">
      {geojson.features.map((featureItem, index) => (
        <path
          key={featureItem.id ?? index}
          d={path(featureItem as GeoPermissibleObjects) ?? undefined}
          className="fill-none stroke-amber-400/60"
          strokeWidth={1}
        />
      ))}
    </g>
  )
}
