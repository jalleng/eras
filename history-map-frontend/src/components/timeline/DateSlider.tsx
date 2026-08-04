import { Range, getTrackBackground } from 'react-range'
import {
  dayNumberToIsoDate,
  formatDisplayDate,
  isoDateToDayNumber,
} from '../../utils/dateUtils'

export const DEFAULT_MIN_GAP_DAYS = 1

interface DateSliderProps {
  rangeStart: string
  rangeEnd: string
  /** Overall lower bound (ISO date) the slider's scale spans. */
  absoluteMinDate: string
  /** Overall upper bound (ISO date) the slider's scale spans. */
  absoluteMaxDate: string
  /** Smallest allowed gap, in days, between the two handles. */
  minGapDays?: number
  onChange: (rangeStart: string, rangeEnd: string) => void
}

/**
 * A dual-handle range slider over a continuous date scale (day-number units
 * -- see `dateUtils.isoDateToDayNumber`), rather than snapping to a fixed
 * list of stops: ingested event data is sparse and unevenly distributed, so
 * a single-point slider makes it too easy to land on an empty date. Built on
 * `react-range` for its thumb hit-testing/keyboard/touch handling; the
 * minimum-gap enforcement below is this app's own policy, clamped in
 * `handleChange`.
 */
export function DateSlider({
  rangeStart,
  rangeEnd,
  absoluteMinDate,
  absoluteMaxDate,
  minGapDays = DEFAULT_MIN_GAP_DAYS,
  onChange,
}: DateSliderProps) {
  const min = isoDateToDayNumber(absoluteMinDate)
  const max = isoDateToDayNumber(absoluteMaxDate)
  const values = [isoDateToDayNumber(rangeStart), isoDateToDayNumber(rangeEnd)]
  const thumbColors = [
    'border-purple-500 bg-purple-500',
    'border-orange-500 bg-orange-500',
  ]
  const labelColors = ['text-purple-500', 'text-orange-500']

  const handleChange = (nextValues: number[]) => {
    const [nextStart, nextEnd] = nextValues

    if (nextEnd - nextStart >= minGapDays) {
      onChange(dayNumberToIsoDate(nextStart), dayNumberToIsoDate(nextEnd))
      return
    }

    // One handle closed to within the minimum gap of the other -- clamp
    // whichever one actually moved against the other, rather than letting
    // them cross or swap positions.
    const startMoved = nextStart !== values[0]
    const start = startMoved ? nextEnd - minGapDays : nextStart
    const end = startMoved ? nextEnd : nextStart + minGapDays
    onChange(dayNumberToIsoDate(start), dayNumberToIsoDate(end))
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatDisplayDate(absoluteMinDate)}</span>
        <span>{formatDisplayDate(absoluteMaxDate)}</span>
      </div>
      {/* A wrapper `div`, separate from the track itself, so a future
          density-overlay layer could be absolutely positioned above the
          track without having to fight a single opaque element. */}
      <div className="relative py-3">
        <Range
          values={values}
          min={min}
          max={max}
          step={1}
          onChange={handleChange}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              className="h-1.5 w-full rounded-full"
              style={{
                ...props.style,
                background: getTrackBackground({
                  values,
                  colors: ['#1e293b', '#0ea5e9', '#1e293b'],
                  min,
                  max,
                }),
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props, index }) => {
            const { key, ...thumbProps } = props
            const label = index === 0 ? 'Range start date' : 'Range end date'
            // A date range is often a tiny sliver of the slider's full
            // (multi-century) scale, so the two thumbs' *hit regions* can
            // land within a fraction of a pixel of each other -- at which
            // point only the topmost (by z-index) is ever clickable, even
            // if they're drawn to look separated. A small, constant
            // vertical stagger (start above the track, end below) keeps
            // both independently grabbable regardless of how close their
            // values are.
            //
            // Two layers make this actually work, not just look right:
            // - The nudge itself lives on an *inner* element, not the thumb
            //   element react-range renders here: react-range holds a ref
            //   to this outer element and imperatively overwrites its
            //   `transform` style on every render/resize (its
            //   `translateThumbs`/`translate` helpers), which would
            //   otherwise clobber a transform set here via props.
            // - The outer element is `pointer-events-none` and the inner,
            //   visually-offset circle is `pointer-events-auto`: without
            //   this, the two (still fully overlapping) outer hit-boxes
            //   would keep deciding clicks by z-index regardless of where
            //   the circles are actually drawn. `getTargetIndex` in
            //   react-range resolves the target thumb via `Node.contains`,
            //   which follows DOM structure rather than pointer-events, so
            //   clicks on the inner circle still correctly resolve to (and
            //   bubble to) this outer element.
            const verticalNudge = index === 0 ? -6 : 6
            return (
              <div
                key={key}
                {...thumbProps}
                aria-label={label}
                aria-valuetext={formatDisplayDate(
                  dayNumberToIsoDate(values[index]),
                )}
              >
                <div
                  style={{ transform: `translateY(${verticalNudge}px)` }}
                  className={`pointer-events-auto h-5 w-5 rounded-full border-2 shadow ${thumbColors[index]}`}
                />
              </div>
            )
          }}
        />
      </div>
      <div className="flex justify-between text-sm font-medium">
        <span className={labelColors[0]}>{formatDisplayDate(rangeStart)}</span>
        <span className={labelColors[1]}>{formatDisplayDate(rangeEnd)}</span>
      </div>
    </div>
  )
}
