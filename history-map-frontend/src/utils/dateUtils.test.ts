import { describe, expect, it } from 'vitest'
import {
  compareIsoDates,
  findClosestDateIndex,
  formatDisplayDate,
  formatDisplayDateRange,
  parseIsoDate,
} from './dateUtils'

describe('parseIsoDate', () => {
  it('parses a well-formed ISO date', () => {
    expect(parseIsoDate('1776-07-04')).toEqual({ year: 1776, month: 7, day: 4 })
  })

  it('parses dates before year 1000 without losing leading zeros', () => {
    expect(parseIsoDate('0044-03-15')).toEqual({ year: 44, month: 3, day: 15 })
  })

  it('throws on a malformed date', () => {
    expect(() => parseIsoDate('July 4, 1776')).toThrow()
    expect(() => parseIsoDate('1776-7-4')).toThrow()
    expect(() => parseIsoDate('')).toThrow()
  })
})

describe('formatDisplayDate', () => {
  it('formats a date as "Month Day, Year"', () => {
    expect(formatDisplayDate('1776-07-04')).toBe('July 4, 1776')
  })

  it('formats December correctly (month index edge case)', () => {
    expect(formatDisplayDate('1941-12-07')).toBe('December 7, 1941')
  })

  it('formats January correctly (month index edge case)', () => {
    expect(formatDisplayDate('1962-01-01')).toBe('January 1, 1962')
  })
})

describe('formatDisplayDateRange', () => {
  it('formats a same-year range without repeating the year on the start date', () => {
    expect(formatDisplayDateRange('1776-06-28', '1776-07-12')).toBe(
      'June 28 – July 12, 1776',
    )
  })

  it('spells out both years when the range crosses a year boundary', () => {
    expect(formatDisplayDateRange('1941-12-30', '1942-01-02')).toBe(
      'December 30, 1941 – January 2, 1942',
    )
  })
})

describe('compareIsoDates', () => {
  it('orders an earlier date before a later one', () => {
    expect(compareIsoDates('1776-07-04', '1941-12-07')).toBeLessThan(0)
  })

  it('orders a later date after an earlier one', () => {
    expect(compareIsoDates('1962-10-27', '1776-07-04')).toBeGreaterThan(0)
  })

  it('treats equal dates as equal', () => {
    expect(compareIsoDates('1941-12-07', '1941-12-07')).toBe(0)
  })

  it('compares across a year boundary correctly (string compare pitfall)', () => {
    // A naive numeric-string compare could mishandle this; ISO's fixed-width
    // fields make lexicographic ordering match chronological ordering.
    expect(compareIsoDates('1941-12-31', '1942-01-01')).toBeLessThan(0)
  })
})

describe('findClosestDateIndex', () => {
  const sortedDates = ['1776-07-04', '1941-12-07', '1962-10-27']

  it('finds an exact match', () => {
    expect(findClosestDateIndex(sortedDates, '1941-12-07')).toBe(1)
  })

  it('finds the closest earlier date when there is no exact match', () => {
    expect(findClosestDateIndex(sortedDates, '1950-01-01')).toBe(1)
  })

  it('returns 0 when the target date is before every curated date', () => {
    expect(findClosestDateIndex(sortedDates, '1700-01-01')).toBe(0)
  })

  it('returns the last index when the target date is after every curated date', () => {
    expect(findClosestDateIndex(sortedDates, '2020-01-01')).toBe(2)
  })

  it('returns 0 for an empty list', () => {
    expect(findClosestDateIndex([], '1941-12-07')).toBe(0)
  })
})
