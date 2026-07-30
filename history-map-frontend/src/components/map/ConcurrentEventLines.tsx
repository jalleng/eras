import type { GeoPath } from 'd3-geo'
import type { HistoricalEvent } from '../../api/types'

interface ConcurrentEventLinesProps {
  events: HistoricalEvent[]
  hoveredEventId: string | null
  path: GeoPath
}

/**
 * When an event is hovered, draws a connecting line from it to every other
 * event happening on the same date elsewhere in the world (the "meanwhile,
 * elsewhere" visualization). Renders nothing when nothing is hovered.
 */
export function ConcurrentEventLines({
  events,
  hoveredEventId,
  path,
}: ConcurrentEventLinesProps) {
  if (!hoveredEventId) return null

  const hoveredEvent = events.find((event) => event.id === hoveredEventId)
  if (!hoveredEvent) return null

  const others = events.filter((event) => event.id !== hoveredEventId)
  if (others.length === 0) return null

  return (
    <g data-testid="concurrent-event-lines" className="pointer-events-none">
      {others.map((other) => {
        const d = path({
          type: 'LineString',
          coordinates: [
            [hoveredEvent.longitude, hoveredEvent.latitude],
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
