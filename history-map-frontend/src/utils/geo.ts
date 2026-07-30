/** Pure geographic helper functions, independent of D3 or any rendering concerns. */

const EARTH_RADIUS_KM = 6371

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/** True if latitude/longitude fall within valid Earth coordinate ranges. */
export function isValidCoordinate(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/** Wraps a longitude value into the canonical [-180, 180] range. */
export function normalizeLongitude(longitude: number): number {
  let normalized = longitude % 360
  if (normalized > 180) normalized -= 360
  if (normalized < -180) normalized += 360
  return normalized
}

/** Great-circle distance between two points, in kilometers (haversine formula). */
export function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)
  const deltaLat = toRadians(b.latitude - a.latitude)
  const deltaLon = toRadians(b.longitude - a.longitude)

  const sinLat = Math.sin(deltaLat / 2)
  const sinLon = Math.sin(deltaLon / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)))

  return EARTH_RADIUS_KM * c
}
