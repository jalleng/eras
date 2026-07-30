import { describe, expect, it } from 'vitest'
import {
  haversineDistanceKm,
  isValidCoordinate,
  normalizeLongitude,
  toDegrees,
  toRadians,
} from './geo'

describe('toRadians / toDegrees', () => {
  it('round-trips 180 degrees to pi radians', () => {
    expect(toRadians(180)).toBeCloseTo(Math.PI)
    expect(toDegrees(Math.PI)).toBeCloseTo(180)
  })

  it('handles zero', () => {
    expect(toRadians(0)).toBe(0)
    expect(toDegrees(0)).toBe(0)
  })
})

describe('isValidCoordinate', () => {
  it('accepts valid coordinates, including the poles and antimeridian', () => {
    expect(isValidCoordinate(0, 0)).toBe(true)
    expect(isValidCoordinate(90, 180)).toBe(true)
    expect(isValidCoordinate(-90, -180)).toBe(true)
  })

  it('rejects out-of-range latitude', () => {
    expect(isValidCoordinate(91, 0)).toBe(false)
    expect(isValidCoordinate(-91, 0)).toBe(false)
  })

  it('rejects out-of-range longitude', () => {
    expect(isValidCoordinate(0, 181)).toBe(false)
    expect(isValidCoordinate(0, -181)).toBe(false)
  })

  it('rejects non-finite values', () => {
    expect(isValidCoordinate(NaN, 0)).toBe(false)
    expect(isValidCoordinate(0, Infinity)).toBe(false)
  })
})

describe('normalizeLongitude', () => {
  it('leaves in-range longitudes unchanged', () => {
    expect(normalizeLongitude(102.2381)).toBeCloseTo(102.2381)
  })

  it('wraps longitudes past 180 back into range', () => {
    expect(normalizeLongitude(190)).toBeCloseTo(-170)
  })

  it('wraps longitudes past -180 back into range', () => {
    expect(normalizeLongitude(-190)).toBeCloseTo(170)
  })

  it('wraps a value crossing multiple full rotations', () => {
    // 540 - 360 = 180, exactly on the antimeridian boundary; the function's
    // (-180, 180] convention keeps it as 180 rather than flipping to -180.
    expect(normalizeLongitude(540)).toBeCloseTo(180)
  })
})

describe('haversineDistanceKm', () => {
  it('returns 0 for identical points', () => {
    const point = { latitude: 39.9496, longitude: -75.1503 }
    expect(haversineDistanceKm(point, point)).toBeCloseTo(0)
  })

  it('computes a known distance (Philadelphia to Plymouth, England)', () => {
    const philadelphia = { latitude: 39.9496, longitude: -75.1503 }
    const plymouth = { latitude: 50.3755, longitude: -4.1427 }
    // Great-circle distance between these two points is approximately 5,470 km.
    expect(haversineDistanceKm(philadelphia, plymouth)).toBeGreaterThan(5400)
    expect(haversineDistanceKm(philadelphia, plymouth)).toBeLessThan(5550)
  })

  it('is symmetric', () => {
    const a = { latitude: 21.3469, longitude: -157.9583 }
    const b = { latitude: 22.3193, longitude: 114.1694 }
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a))
  })
})
