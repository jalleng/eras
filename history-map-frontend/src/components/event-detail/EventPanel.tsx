import type { HistoricalEvent } from '../../api/types'
import { ConcurrentEventsList } from './ConcurrentEventsList'

interface EventPanelProps {
  event: HistoricalEvent | null
  /** All events for the currently selected date, passed through to the concurrent-events list. */
  allEvents: HistoricalEvent[]
  hoveredEventId: string | null
  onHoverEvent: (id: string | null) => void
  onSelectEvent: (id: string) => void
  onClose: () => void
}

/** Detail panel shown when an event marker is clicked/selected. */
export function EventPanel({
  event,
  allEvents,
  hoveredEventId,
  onHoverEvent,
  onSelectEvent,
  onClose,
}: EventPanelProps) {
  if (!event) return null

  return (
    <aside
      aria-label="Event details"
      className="flex h-full w-full flex-col gap-4 overflow-y-auto border-l border-slate-800 bg-slate-900 p-4 text-white sm:w-80"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{event.title}</h2>
          <p className="text-sm text-slate-400">
            {event.location} &middot; {event.region}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close event details"
          className="rounded p-1 text-slate-400 hover:text-white"
        >
          &#10005;
        </button>
      </div>

      <p className="text-sm text-slate-200">{event.description}</p>

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Meanwhile, elsewhere
        </h3>
        <ConcurrentEventsList
          events={allEvents}
          focusedEventId={event.id}
          hoveredEventId={hoveredEventId}
          onHoverEvent={onHoverEvent}
          onSelectEvent={onSelectEvent}
        />
      </div>
    </aside>
  )
}
