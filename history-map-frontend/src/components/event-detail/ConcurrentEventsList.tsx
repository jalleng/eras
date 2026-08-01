import type { HistoricalEvent } from '../../api/types'

interface ConcurrentEventsListProps {
  /** The focused event's own concurrent cluster (already excludes the focused event itself). */
  concurrentEvents: HistoricalEvent[]
  hoveredEventId: string | null
  onHoverEvent: (id: string | null) => void
  onFocusEvent: (id: string) => void
}

/** Lists everything in the focused event's concurrent cluster, syncing hover with the map's connecting lines. */
export function ConcurrentEventsList({
  concurrentEvents,
  hoveredEventId,
  onHoverEvent,
  onFocusEvent,
}: ConcurrentEventsListProps) {
  if (concurrentEvents.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No other recorded events for this date.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {concurrentEvents.map((event) => (
        <li key={event.id}>
          <button
            type="button"
            onMouseEnter={() => onHoverEvent(event.id)}
            onMouseLeave={() => onHoverEvent(null)}
            onFocus={() => onHoverEvent(event.id)}
            onBlur={() => onHoverEvent(null)}
            onClick={() => onFocusEvent(event.id)}
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
