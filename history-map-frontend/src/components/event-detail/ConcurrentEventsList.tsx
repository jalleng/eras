import type { HistoricalEvent } from '../../api/types'

interface ConcurrentEventsListProps {
  /** All events for the currently selected date. */
  events: HistoricalEvent[]
  /** The event currently focused/open in the detail panel, excluded from the list. */
  focusedEventId: string | null
  hoveredEventId: string | null
  onHoverEvent: (id: string | null) => void
  onSelectEvent: (id: string) => void
}

/** Lists every other event happening on the same date, syncing hover with the map's connecting lines. */
export function ConcurrentEventsList({
  events,
  focusedEventId,
  hoveredEventId,
  onHoverEvent,
  onSelectEvent,
}: ConcurrentEventsListProps) {
  const others = events.filter((event) => event.id !== focusedEventId)

  if (others.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No other recorded events for this date.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {others.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            onMouseEnter={() => onHoverEvent(event.id)}
            onMouseLeave={() => onHoverEvent(null)}
            onFocus={() => onHoverEvent(event.id)}
            onBlur={() => onHoverEvent(null)}
            onClick={() => onSelectEvent(event.id)}
            className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
              hoveredEventId === event.id
                ? 'border-sky-400 bg-sky-950/50'
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
            }`}
          >
            <p className="text-sm font-medium text-white">{event.title}</p>
            <p className="text-xs text-slate-400">
              {event.location} &middot; {event.region}
            </p>
          </button>
        </li>
      ))}
    </ul>
  )
}
