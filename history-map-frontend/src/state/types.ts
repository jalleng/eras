import type { ProjectionType } from '../components/map/useD3Projection'

export interface MapState {
  selectedDateIndex: number
  projectionType: ProjectionType
  hoveredEventId: string | null
  selectedEventId: string | null
}

export type MapAction =
  | { type: 'SELECT_DATE_INDEX'; index: number }
  | { type: 'SET_PROJECTION'; projectionType: ProjectionType }
  | { type: 'HOVER_EVENT'; id: string | null }
  | { type: 'SELECT_EVENT'; id: string | null }
