import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { select } from 'd3-selection'
import { zoom as d3zoom, type D3ZoomEvent } from 'd3-zoom'
import { drag as d3drag, type D3DragEvent, type SubjectPosition } from 'd3-drag'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import landTopology from 'world-atlas/land-110m.json'
import {
  useD3Projection,
  type ProjectionType,
  type Rotation,
} from './useD3Projection'
import { BoundaryLayer } from './BoundaryLayer'
import { EventMarkers } from './EventMarkers'
import { ConcurrentEventLines } from './ConcurrentEventLines'
import { EventTooltip } from '../event-detail/EventTooltip'
import type { HistoricalEvent, PolityBoundaryCollection } from '../../api/types'

const WIDTH = 960
const HEIGHT = 500
const DEFAULT_ROTATE: Rotation = [0, -10, 0]

// world-atlas ships this as raw TopoJSON; converting the "land" object to a
// single GeoJSON feature once at module load avoids redoing it every render.
const landFeature = feature(
  landTopology as unknown as Topology,
  (landTopology as unknown as Topology).objects.land as GeometryCollection,
)

interface WorldMapProps {
  events: HistoricalEvent[]
  hoveredEventId: string | null
  selectedEventId: string | null
  onHoverEvent: (id: string | null) => void
  onSelectEvent: (id: string) => void
  projectionType: ProjectionType
  boundaries?: PolityBoundaryCollection['geojson']
}

export function WorldMap({
  events,
  hoveredEventId,
  selectedEventId,
  onHoverEvent,
  onSelectEvent,
  projectionType,
  boundaries,
}: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [prevProjectionType, setPrevProjectionType] =
    useState<ProjectionType>(projectionType)
  const [rotate, setRotate] = useState<Rotation>(DEFAULT_ROTATE)
  const [zoomK, setZoomK] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [pointerPosition, setPointerPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  // Pan/rotate/zoom state from one projection mode isn't meaningful in the
  // other, so switching modes resets the view instead of carrying it over.
  // Adjusting state during render (rather than in an effect) avoids an extra
  // render with the stale view before the reset takes effect.
  if (projectionType !== prevProjectionType) {
    setPrevProjectionType(projectionType)
    setRotate(DEFAULT_ROTATE)
    setZoomK(1)
    setPan({ x: 0, y: 0 })
  }

  const { projection, path } = useD3Projection({
    type: projectionType,
    width: WIDTH,
    height: HEIGHT,
    rotate: projectionType === 'orthographic' ? rotate : [0, 0, 0],
    fitFeature: landFeature,
  })

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const selection = select(svgEl)

    if (projectionType === 'equirectangular') {
      const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 8])
        .translateExtent([
          [0, 0],
          [WIDTH, HEIGHT],
        ])
        .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
          setZoomK(event.transform.k)
          setPan({ x: event.transform.x, y: event.transform.y })
        })

      selection.call(zoomBehavior)
      return () => {
        selection.on('.zoom', null)
      }
    }

    // Orthographic: dragging rotates the globe; wheel/dblclick zoom scales it.
    const dragBehavior = d3drag<SVGSVGElement, unknown>().on(
      'drag',
      (event: D3DragEvent<SVGSVGElement, unknown, SubjectPosition>) => {
        const sensitivity = 0.35
        setRotate(([lambda, phi, gamma]) => [
          lambda + event.dx * sensitivity,
          Math.max(-90, Math.min(90, phi - event.dy * sensitivity)),
          gamma,
        ])
      },
    )
    const zoomBehavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 4])
      .filter(
        (event: Event) => event.type === 'wheel' || event.type === 'dblclick',
      )
      .on('zoom', (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setZoomK(event.transform.k)
      })

    selection.call(dragBehavior).call(zoomBehavior)
    return () => {
      selection.on('.drag', null)
      selection.on('.zoom', null)
    }
  }, [projectionType])

  const transform =
    projectionType === 'orthographic'
      ? `translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${zoomK}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`
      : `translate(${pan.x} ${pan.y}) scale(${zoomK})`

  const hoveredEvent =
    events.find((event) => event.id === hoveredEventId) ?? null

  const handlePointerMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    setPointerPosition({ x: event.clientX, y: event.clientY })
  }

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-full w-full touch-none select-none bg-slate-950"
        role="img"
        aria-label="World map showing historical events for the selected date"
        onMouseMove={handlePointerMove}
        onMouseLeave={() => setPointerPosition(null)}
      >
        <g transform={transform}>
          {projectionType === 'orthographic' && (
            <path
              d={path({ type: 'Sphere' }) ?? undefined}
              className="fill-slate-800"
            />
          )}
          <path
            d={path(landFeature) ?? undefined}
            className="fill-slate-500 stroke-slate-700"
            strokeWidth={0.5}
          />
          <BoundaryLayer geojson={boundaries} path={path} />
          <ConcurrentEventLines
            events={events}
            hoveredEventId={hoveredEventId}
            path={path}
          />
          <EventMarkers
            events={events}
            projection={projection}
            hoveredEventId={hoveredEventId}
            selectedEventId={selectedEventId}
            onHoverEvent={onHoverEvent}
            onSelectEvent={onSelectEvent}
            markerScale={zoomK}
            rotate={projectionType === 'orthographic' ? rotate : null}
          />
        </g>
      </svg>
      <EventTooltip event={hoveredEvent} position={pointerPosition} />
    </>
  )
}
