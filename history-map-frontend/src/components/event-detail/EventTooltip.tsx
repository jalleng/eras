import type { HistoricalEvent } from '../../api/types'

interface EventTooltipProps {
  event: HistoricalEvent | null
  /** Viewport pixel coordinates (e.g. from a mousemove clientX/clientY), or null to hide. */
  position: { x: number; y: number } | null
}

/** A cursor-following tooltip shown while hovering an event marker. */
export function EventTooltip({ event, position }: EventTooltipProps) {
  if (!event || !position) return null

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-xs rounded-md border border-slate-700 bg-slate-900/95 p-3 text-sm text-white shadow-lg"
      style={{ left: position.x + 14, top: position.y + 14 }}
    >
      <p className="font-semibold">{event.title}</p>
      <p className="text-xs text-slate-400">
        {event.location} &middot; {event.region}
      </p>
      <p className="mt-1 text-slate-200">{event.description}</p>
    </div>
  )
}
