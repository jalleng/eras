/**
 * Date helpers for the curated dataset. All curated dates are ISO 8601
 * (YYYY-MM-DD) strings in the Gregorian calendar (CE) — this app's dataset
 * never needs BCE dates, but the parsing/formatting here still avoids the
 * classic pitfall of letting `new Date('YYYY-MM-DD')` parse as UTC midnight
 * and then rendering in a different local timezone, which can shift the
 * displayed day by one.
 */

/** Parses an ISO 8601 date string (YYYY-MM-DD) into its numeric parts, without timezone shifting. */
export function parseIsoDate(isoDate: string): {
  year: number
  month: number
  day: number
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) {
    throw new Error(`Invalid ISO date: ${isoDate}`)
  }
  const [, year, month, day] = match
  return { year: Number(year), month: Number(month), day: Number(day) }
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** Formats an ISO date as e.g. "July 4, 1776". */
export function formatDisplayDate(isoDate: string): string {
  const { year, month, day } = parseIsoDate(isoDate)
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`
}

/** Formats an event's date span, e.g. "June 28 – July 12, 1776" (or, across a year boundary, "December 30, 1941 – January 2, 1942"). */
export function formatDisplayDateRange(startIsoDate: string, endIsoDate: string): string {
  const start = parseIsoDate(startIsoDate)
  const end = parseIsoDate(endIsoDate)
  const startLabel =
    start.year === end.year
      ? `${MONTH_NAMES[start.month - 1]} ${start.day}`
      : formatDisplayDate(startIsoDate)
  return `${startLabel} – ${formatDisplayDate(endIsoDate)}`
}

/** Compares two ISO dates chronologically (negative if `a` is earlier than `b`). */
export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b)
}

/** Finds the index of the closest date at or before `targetIsoDate` in a sorted list of ISO dates, defaulting to 0. */
export function findClosestDateIndex(
  sortedIsoDates: string[],
  targetIsoDate: string,
): number {
  let closestIndex = 0
  for (let i = 0; i < sortedIsoDates.length; i++) {
    if (compareIsoDates(sortedIsoDates[i], targetIsoDate) <= 0) {
      closestIndex = i
    } else {
      break
    }
  }
  return closestIndex
}
