import type { KeyboardEvent } from 'react'
import { geoDistance, type GeoProjection } from 'd3-geo'
import type { HistoricalEvent } from '../../api/types'
import { colorForRegion } from '../../utils/colorScale'
import type { Rotation } from './useD3Projection'

interface EventMarkersProps {
  events: HistoricalEvent[]
  projection: GeoProjection
  hoveredEventId: string | null
  selectedEventId: string | null
  onHoverEvent: (id: string | null) => void
  onSelectEvent: (id: string) => void
  /** Counter-scales marker radius against the current zoom level so markers stay a consistent on-screen size. */
  markerScale?: number
  /**
   * Current globe rotation, used to detect events on the far hemisphere so
   * they can be drawn as "hidden" instead of floating on top of the globe.
   * Pass null when there's no hidden face to worry about (flat map).
   */
  rotate?: Rotation | null
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
  rotate = null,
}: EventMarkersProps) {
  const radius = BASE_RADIUS / markerScale

  // The point currently centered in view is the antipode of the rotation,
  // so anything more than a quarter-turn away from it is on the far side
  // of the sphere and shouldn't read as sitting on the front face.
  const visibleCenter: [number, number] | null = rotate
    ? [-rotate[0], -rotate[1]]
    : null

  return (
    <g data-testid="event-markers">
      {events.map((event) => {
        const projected = projection([event.longitude, event.latitude])
        if (!projected) return null
        const [x, y] = projected
        const isHovered = hoveredEventId === event.id
        const isSelected = selectedEventId === event.id
        const isOnFarSide =
          visibleCenter !== null &&
          geoDistance(
            [event.longitude, event.latitude],
            visibleCenter,
          ) >
            Math.PI / 2

        const handleKeyDown = (keyboardEvent: KeyboardEvent<SVGGElement>) => {
          if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
            keyboardEvent.preventDefault()
            onSelectEvent(event.id)
          }
        }

        return (
          <g
            key={event.id}
            tabIndex={isOnFarSide ? -1 : 0}
            role="button"
            aria-hidden={isOnFarSide}
            aria-label={`${event.title}, ${event.location}`}
            className={
              isOnFarSide
                ? 'pointer-events-none outline-none'
                : 'cursor-pointer outline-none'
            }
            onMouseEnter={() => onHoverEvent(event.id)}
            onMouseLeave={() => onHoverEvent(null)}
            onFocus={() => onHoverEvent(event.id)}
            onBlur={() => onHoverEvent(null)}
            onClick={() => onSelectEvent(event.id)}
            onKeyDown={handleKeyDown}
          >
            {!isOnFarSide && (isHovered || isSelected) && (
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
              fill={isOnFarSide ? 'none' : colorForRegion(event.region)}
              stroke={
                isOnFarSide
                  ? 'rgba(148,163,184,0.45)'
                  : isHovered || isSelected
                    ? '#fff'
                    : 'rgba(15,23,42,0.8)'
              }
              strokeWidth={isOnFarSide ? 1 : isHovered || isSelected ? 2 : 1}
              strokeDasharray={isOnFarSide ? '2,2' : undefined}
              opacity={isOnFarSide ? 0.5 : undefined}
            />
          </g>
        )
      })}
    </g>
  )
}
