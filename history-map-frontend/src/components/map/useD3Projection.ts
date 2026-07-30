import { useMemo } from 'react'
import { geoEquirectangular, geoOrthographic, geoPath } from 'd3-geo'
import type { GeoPath, GeoPermissibleObjects, GeoProjection } from 'd3-geo'

export type ProjectionType = 'equirectangular' | 'orthographic'

/** [lambda, phi, gamma] rotation in degrees, as used by d3.geoProjection.rotate(). */
export type Rotation = [number, number, number]

interface UseD3ProjectionArgs {
  type: ProjectionType
  width: number
  height: number
  rotate: Rotation
  /** Feature (or collection) the projection's base scale/translate are fit to, once, ignoring rotation. */
  fitFeature: GeoPermissibleObjects
}

interface UseD3ProjectionResult {
  projection: GeoProjection
  path: GeoPath
}

/**
 * Builds a D3 geographic projection (equirectangular or orthographic) fit to
 * a fixed pixel size, plus the matching path generator. Rotation is applied
 * imperatively after the initial fit, so rotating the globe never changes
 * its zoom level — only `type`/`width`/`height` changes re-fit the base
 * scale and translate.
 */
export function useD3Projection({
  type,
  width,
  height,
  rotate,
  fitFeature,
}: UseD3ProjectionArgs): UseD3ProjectionResult {
  const projection = useMemo(() => {
    const base =
      type === 'orthographic' ? geoOrthographic() : geoEquirectangular()
    if (width > 0 && height > 0) {
      if (type === 'orthographic') {
        // Fit to the sphere itself (not the land data), so the globe is
        // always a full circle inscribed in the viewport regardless of
        // which landmasses are currently rotated into view.
        base.clipAngle(90).fitSize([width, height], { type: 'Sphere' })
      } else {
        base.fitSize([width, height], fitFeature)
      }
    }
    return base
  }, [type, width, height, fitFeature])

  const [lambda, phi, gamma] = rotate
  projection.rotate([lambda, phi, gamma])

  // `projection` is mutated in place by `.rotate()` above rather than
  // recreated, so lambda/phi/gamma must stay in the dependency array to
  // force recomputation even though the callback body doesn't read them.
  /* eslint-disable react-hooks/exhaustive-deps */
  const path = useMemo(
    () => geoPath(projection),
    [projection, lambda, phi, gamma],
  )
  /* eslint-enable react-hooks/exhaustive-deps */

  return { projection, path }
}
