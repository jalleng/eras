import type { GeoPath } from 'd3-geo'
import type { HistoricalEvent } from '../../api/types'

interface ConcurrentEventLinesProps {
  /** The event the user has clicked into; the anchor lines are drawn from. */
  focusedEvent: HistoricalEvent | null
  /**
   * The focused event's own "meanwhile, elsewhere" cluster (from
   * `GET /events/{id}/concurrent`), independent of whatever date range is
   * currently browsed -- lines are drawn to these regardless of whether
   * they fall inside the visible range.
   */
  concurrentEvents: HistoricalEvent[]
  path: GeoPath
}

/**
 * When an event is focused (clicked), draws a connecting line from it to
 * every event in its own concurrent cluster elsewhere in the world (the
 * "meanwhile, elsewhere" visualization). Renders nothing when nothing is
 * focused.
 */
export function ConcurrentEventLines({
  focusedEvent,
  concurrentEvents,
  path,
}: ConcurrentEventLinesProps) {
  if (!focusedEvent || concurrentEvents.length === 0) return null

  return (
    <g data-testid="concurrent-event-lines" className="pointer-events-none">
      {concurrentEvents.map((other) => {
        const d = path({
          type: 'LineString',
          coordinates: [
            [focusedEvent.longitude, focusedEvent.latitude],
            [other.longitude, other.latitude],
          ],
        })
        if (!d) return null
        return (
          <path
            key={other.id}
            d={d}
            className="fill-none stroke-white/70"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )
      })}
    </g>
  )
}
