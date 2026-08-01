import {
  createContext,
  createElement,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { featuredRanges } from '../data/curatedDates'
import type { MapAction, MapState } from './types'

const initialState: MapState = {
  rangeStart: featuredRanges[0].rangeStart,
  rangeEnd: featuredRanges[0].rangeEnd,
  projectionType: 'equirectangular',
  hoveredEventId: null,
  focusedEventId: null,
}

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_RANGE':
      // Deliberately does NOT touch focusedEventId: the range and the
      // focused event are independent. Whether a focus should be cleared
      // because it's now outside the range is decided at the app level
      // (where the focused event's own date is known), not here.
      return { ...state, rangeStart: action.rangeStart, rangeEnd: action.rangeEnd }
    case 'SET_PROJECTION':
      return { ...state, projectionType: action.projectionType }
    case 'HOVER_EVENT':
      return { ...state, hoveredEventId: action.id }
    case 'FOCUS_EVENT':
      return { ...state, focusedEventId: action.id }
    default:
      return state
  }
}

const MapStateContext = createContext<MapState | null>(null)
const MapDispatchContext = createContext<Dispatch<MapAction> | null>(null)

interface MapStoreProviderProps {
  children: ReactNode
}

// Written with createElement (rather than JSX) so this stays a plain .ts
// file per the project's required structure.
export function MapStoreProvider({ children }: MapStoreProviderProps) {
  const [state, dispatch] = useReducer(mapReducer, initialState)
  return createElement(
    MapStateContext.Provider,
    { value: state },
    createElement(MapDispatchContext.Provider, { value: dispatch }, children),
  )
}

export function useMapState(): MapState {
  const context = useContext(MapStateContext)
  if (!context) {
    throw new Error('useMapState must be used within a MapStoreProvider')
  }
  return context
}

export function useMapDispatch(): Dispatch<MapAction> {
  const context = useContext(MapDispatchContext)
  if (!context) {
    throw new Error('useMapDispatch must be used within a MapStoreProvider')
  }
  return context
}
