import {
  createContext,
  createElement,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { MapAction, MapState } from './types'

const initialState: MapState = {
  selectedDateIndex: 0,
  projectionType: 'equirectangular',
  hoveredEventId: null,
  selectedEventId: null,
}

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SELECT_DATE_INDEX':
      // Changing dates closes any open detail panel, since the selected
      // event belongs to the date being navigated away from.
      return {
        ...state,
        selectedDateIndex: action.index,
        selectedEventId: null,
      }
    case 'SET_PROJECTION':
      return { ...state, projectionType: action.projectionType }
    case 'HOVER_EVENT':
      return { ...state, hoveredEventId: action.id }
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.id }
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
