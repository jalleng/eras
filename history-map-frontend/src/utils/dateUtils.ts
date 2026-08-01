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

/** Whether two inclusive ISO date spans [aStart, aEnd] and [bStart, bEnd] overlap at all. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return compareIsoDates(aStart, bEnd) <= 0 && compareIsoDates(bStart, aEnd) <= 0
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Converts an ISO date to a whole-number day offset (in UTC, never the
 * local timezone, for the same reason noted above). Used to drive the range
 * slider, which operates on plain numbers rather than date strings — one
 * integer step is exactly one day.
 *
 * Built with `setUTCFullYear` rather than `Date.UTC`/`new Date(y, m, d)`:
 * both of those special-case a two-digit year (0-99) as 1900+year, which
 * would silently corrupt any date before 1000 CE. `setUTCFullYear` applies
 * the year literally, with no such special-casing.
 */
export function isoDateToDayNumber(isoDate: string): number {
  const { year, month, day } = parseIsoDate(isoDate)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return Math.round(date.getTime() / MS_PER_DAY)
}

/** Inverse of `isoDateToDayNumber`: converts a whole-number day offset back to an ISO date string. */
export function dayNumberToIsoDate(dayNumber: number): string {
  const date = new Date(dayNumber * MS_PER_DAY)
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
