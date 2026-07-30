import type { KeyboardEvent } from 'react'
import type { GeoProjection } from 'd3-geo'
import type { HistoricalEvent } from '../../api/types'
import { colorForRegion } from '../../utils/colorScale'

interface EventMarkersProps {
  events: HistoricalEvent[]
  projection: GeoProjection
  hoveredEventId: string | null
  selectedEventId: string | null
  onHoverEvent: (id: string | null) => void
  onSelectEvent: (id: string) => void
  /** Counter-scales marker radius against the current zoom level so markers stay a consistent on-screen size. */
  markerScale?: number
}

const BASE_RADIUS = 6

export function EventMarkers({
  events,
  projection,
  hoveredEventId,
  selectedEventId,
  onHoverEvent,
  onSelectEvent,
  markerScale = 1,
}: EventMarkersProps) {
  const radius = BASE_RADIUS / markerScale

  return (
    <g data-testid="event-markers">
      {events.map((event) => {
        const projected = projection([event.longitude, event.latitude])
        if (!projected) return null
        const [x, y] = projected
        const isHovered = hoveredEventId === event.id
        const isSelected = selectedEventId === event.id

        const handleKeyDown = (keyboardEvent: KeyboardEvent<SVGGElement>) => {
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault()
            onSelectEvent(event.id)
          }
        }

        return (
          <g
            key={event.id}
            tabIndex={0}
            role="button"
            aria-label={`${event.title}, ${event.location}`}
            className="cursor-pointer outline-none"
            onMouseEnter={() => onHoverEvent(event.id)}
            onMouseLeave={() => onHoverEvent(null)}
            onFocus={() => onHoverEvent(event.id)}
            onBlur={() => onHoverEvent(null)}
            onClick={() => onSelectEvent(event.id)}
            onKeyDown={handleKeyDown}
          >
            {(isHovered || isSelected) && (
              <circle
                cx={x}
                cy={y}
                r={radius * 2.2}
                className="fill-white/20"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={isSelected ? radius * 1.3 : radius}
              fill={colorForRegion(event.region)}
              stroke={isHovered || isSelected ? '#fff' : 'rgba(15,23,42,0.8)'}
              strokeWidth={isHovered || isSelected ? 2 : 1}
            />
          </g>
        )
      })}
    </g>
  )
}
