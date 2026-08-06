import { useEffect } from 'react'
import { featuredRanges } from './data/curatedDates'
import { useEventsForRange } from './hooks/useEventsForRange'
import { useFocusedEvent } from './hooks/useFocusedEvent'
import { useConcurrentEvents } from './hooks/useConcurrentEvents'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { MapStoreProvider, useMapDispatch, useMapState } from './state/mapStore'
import { Layout } from './components/layout/Layout'
import { WorldMap } from './components/map/WorldMap'
import { MapProjectionToggle } from './components/map/MapProjectionToggle'
import { DateSlider } from './components/timeline/DateSlider'
import { DateDisplay } from './components/timeline/DateDisplay'
import { EventPanel } from './components/event-detail/EventPanel'
import { rangesOverlap } from './utils/dateUtils'

// Overall bounds the range slider's scale spans. There's no data-backed
// "what dates actually have events" index (deliberately out of scope for
// now -- see the range-slider rework proposal), so this is a hand-picked
// window wide enough to cover everything ingested so far with headroom.
const ABSOLUTE_MIN_DATE = '1700-01-01'
const ABSOLUTE_MAX_DATE = new Date().toISOString().slice(0, 10)

function AppContent() {
  const state = useMapState()
  const dispatch = useMapDispatch()

  // The range label and slider thumbs track state immediately; only the
  // (network) fetch this triggers is debounced, so dragging quickly across
  // the timeline doesn't fire a request per intermediate tick. Combined into
  // one string key so the two dates settle together as a single fetch.
  const debouncedRangeKey = useDebouncedValue(
    `${state.rangeStart}|${state.rangeEnd}`,
    250,
  )
  const [debouncedRangeStart, debouncedRangeEnd] = debouncedRangeKey.split('|')
  const { events, isLoading: eventsLoading } = useEventsForRange(
    debouncedRangeStart,
    debouncedRangeEnd,
  )

  // The focused event is fetched by id -- independent of the range fetch --
  // so it keeps its own date span even if the range moves elsewhere.
  const { focusedEvent } = useFocusedEvent(state.focusedEventId)
  const { concurrentEvents } = useConcurrentEvents(state.focusedEventId)

  // Changing the range never clears the focus by itself (see mapStore); it
  // only gets cleared here, once we know the focused event's own date span,
  // if that span no longer overlaps the (possibly newly dragged-to) range.
  useEffect(() => {
    if (!focusedEvent) return
    const eventEnd = focusedEvent.dateEnd ?? focusedEvent.dateStart
    const stillInRange = rangesOverlap(
      focusedEvent.dateStart,
      eventEnd,
      state.rangeStart,
      state.rangeEnd,
    )
    if (!stillInRange) {
      dispatch({ type: 'FOCUS_EVENT', id: null })
    }
  }, [focusedEvent, state.rangeStart, state.rangeEnd, dispatch])

  return (
    <Layout>
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <DateDisplay
            rangeStart={state.rangeStart}
            rangeEnd={state.rangeEnd}
            eventCount={eventsLoading ? null : events.length}
          />
          <MapProjectionToggle
            value={state.projectionType}
            onChange={(projectionType) =>
              dispatch({ type: 'SET_PROJECTION', projectionType })
            }
          />
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3">
          <DateSlider
            rangeStart={state.rangeStart}
            rangeEnd={state.rangeEnd}
            absoluteMinDate={ABSOLUTE_MIN_DATE}
            absoluteMaxDate={ABSOLUTE_MAX_DATE}
            onChange={(rangeStart, rangeEnd) =>
              dispatch({ type: 'SET_RANGE', rangeStart, rangeEnd })
            }
          />
          <div className="flex flex-wrap gap-2">
            {featuredRanges.map((featured) => (
              <button
                key={featured.label}
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_RANGE',
                    rangeStart: featured.rangeStart,
                    rangeEnd: featured.rangeEnd,
                  })
                }
                className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-sky-400 hover:text-sky-300"
              >
                {featured.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 flex-1 bg-slate-950">
            <WorldMap
              events={events}
              hoveredEventId={state.hoveredEventId}
              focusedEventId={state.focusedEventId}
              focusedEvent={focusedEvent}
              concurrentEvents={concurrentEvents}
              onHoverEvent={(id) => dispatch({ type: 'HOVER_EVENT', id })}
              onFocusEvent={(id) => dispatch({ type: 'FOCUS_EVENT', id })}
              projectionType={state.projectionType}
            />
          </div>
          {focusedEvent && (
            <EventPanel
              event={focusedEvent}
              concurrentEvents={concurrentEvents}
              hoveredEventId={state.hoveredEventId}
              onHoverEvent={(id) => dispatch({ type: 'HOVER_EVENT', id })}
              onFocusEvent={(id) => dispatch({ type: 'FOCUS_EVENT', id })}
              onClose={() => dispatch({ type: 'FOCUS_EVENT', id: null })}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

function App() {
  return (
    <MapStoreProvider>
      <AppContent />
    </MapStoreProvider>
  )
}

export default App
