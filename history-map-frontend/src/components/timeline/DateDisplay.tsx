import { formatDisplayDateRange } from '../../utils/dateUtils'

interface DateDisplayProps {
  rangeStart: string
  rangeEnd: string
  /** Number of events in the current range, or null while that count is still loading/settling. */
  eventCount: number | null
}

export function DateDisplay({ rangeStart, rangeEnd, eventCount }: DateDisplayProps) {
  return (
    <div>
      <p className="text-xl font-semibold text-white sm:text-2xl">
        {formatDisplayDateRange(rangeStart, rangeEnd)}
      </p>
      <p className="text-sm text-slate-400">
        {eventCount === null
          ? 'Counting events…'
          : `${eventCount} event${eventCount === 1 ? '' : 's'} in this range`}
      </p>
    </div>
  )
}
