import type { ChangeEvent } from 'react'
import type { CuratedDateEntry } from '../../api/types'
import { formatDisplayDate } from '../../utils/dateUtils'

interface DateSliderProps {
  dates: CuratedDateEntry[]
  selectedIndex: number
  onChange: (index: number) => void
}

/**
 * Steps through the curated dates by index (rather than a continuous
 * timeline), since the curated dates aren't evenly spaced in time. A native
 * `<input type="range">` gets keyboard support (arrow keys, Home/End,
 * Page Up/Down) for free.
 */
export function DateSlider({
  dates,
  selectedIndex,
  onChange,
}: DateSliderProps) {
  const current = dates[selectedIndex]

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value))
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <input
        type="range"
        min={0}
        max={Math.max(0, dates.length - 1)}
        step={1}
        value={selectedIndex}
        onChange={handleChange}
        aria-label="Select a date to explore"
        aria-valuetext={
          current ? formatDisplayDate(current.isoDate) : undefined
        }
        className="w-full accent-sky-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        {dates.map((date, index) => (
          <span
            key={date.isoDate}
            className={index === selectedIndex ? 'text-sky-400' : undefined}
          >
            {formatDisplayDate(date.isoDate).split(', ').pop()}
          </span>
        ))}
      </div>
    </div>
  )
}
