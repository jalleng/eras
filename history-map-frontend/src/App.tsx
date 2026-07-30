import { curatedDates } from './data/curatedDates'
import { useEventsForDate } from './hooks/useEventsForDate'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { MapStoreProvider, useMapDispatch, useMapState } from './state/mapStore'
import { Layout } from './components/layout/Layout'
import { WorldMap } from './components/map/WorldMap'
import { MapProjectionToggle } from './components/map/MapProjectionToggle'
import { DateSlider } from './components/timeline/DateSlider'
import { DateDisplay } from './components/timeline/DateDisplay'
import { EventPanel } from './components/event-detail/EventPanel'

function AppContent() {
  const state = useMapState()
  const dispatch = useMapDispatch()

  const currentDateEntry = curatedDates[state.selectedDateIndex]
  // The slider's own label updates immediately; only the (simulated) data
  // fetch this triggers is debounced, so dragging quickly across dates
  // doesn't fire a lookup per intermediate tick.
  const debouncedIsoDate = useDebouncedValue(currentDateEntry.isoDate, 250)
  const { events } = useEventsForDate(debouncedIsoDate)

  const selectedEvent =
    events.find((event) => event.id === state.selectedEventId) ?? null

  return (
    <Layout>
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <DateDisplay
            isoDate={currentDateEntry.isoDate}
            label={currentDateEntry.label}
          />
          <MapProjectionToggle
            value={state.projectionType}
            onChange={(projectionType) =>
              dispatch({ type: 'SET_PROJECTION', projectionType })
            }
          />
        </div>

        <div className="border-b border-slate-800 px-4 py-3">
          <DateSlider
            dates={curatedDates}
            selectedIndex={state.selectedDateIndex}
            onChange={(index) => dispatch({ type: 'SELECT_DATE_INDEX', index })}
          />
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-h-0 flex-1">
            <WorldMap
              events={events}
              hoveredEventId={state.hoveredEventId}
              selectedEventId={state.selectedEventId}
              onHoverEvent={(id) => dispatch({ type: 'HOVER_EVENT', id })}
              onSelectEvent={(id) => dispatch({ type: 'SELECT_EVENT', id })}
              projectionType={state.projectionType}
            />
          </div>
          {selectedEvent && (
            <EventPanel
              event={selectedEvent}
              allEvents={events}
              hoveredEventId={state.hoveredEventId}
              onHoverEvent={(id) => dispatch({ type: 'HOVER_EVENT', id })}
              onSelectEvent={(id) => dispatch({ type: 'SELECT_EVENT', id })}
              onClose={() => dispatch({ type: 'SELECT_EVENT', id: null })}
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
