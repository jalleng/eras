import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MapStoreProvider, useMapDispatch, useMapState } from './mapStore'
import { featuredRanges } from '../data/curatedDates'

function setup() {
  return renderHook(
    () => ({ state: useMapState(), dispatch: useMapDispatch() }),
    { wrapper: MapStoreProvider },
  )
}

describe('mapStore', () => {
  it('defaults the range to the first featured range and clears hover/focus', () => {
    const { result } = setup()
    expect(result.current.state.rangeStart).toBe(featuredRanges[0].rangeStart)
    expect(result.current.state.rangeEnd).toBe(featuredRanges[0].rangeEnd)
    expect(result.current.state.hoveredEventId).toBeNull()
    expect(result.current.state.focusedEventId).toBeNull()
  })

  it('SET_RANGE updates the range without touching focusedEventId', () => {
    const { result } = setup()
    act(() => result.current.dispatch({ type: 'FOCUS_EVENT', id: 'some-event' }))
    expect(result.current.state.focusedEventId).toBe('some-event')

    act(() =>
      result.current.dispatch({
        type: 'SET_RANGE',
        rangeStart: '1941-12-07',
        rangeEnd: '1941-12-08',
      }),
    )

    expect(result.current.state.rangeStart).toBe('1941-12-07')
    expect(result.current.state.rangeEnd).toBe('1941-12-08')
    // Independent: changing the range alone never clears focus. Clearing a
    // focus that's fallen outside the new range is an app-level policy
    // (it needs the focused event's own date, which the reducer doesn't
    // have), exercised in App.test.tsx instead.
    expect(result.current.state.focusedEventId).toBe('some-event')
  })

  it('FOCUS_EVENT updates focusedEventId without touching the range', () => {
    const { result } = setup()
    const { rangeStart, rangeEnd } = result.current.state

    act(() => result.current.dispatch({ type: 'FOCUS_EVENT', id: 'event-a' }))

    expect(result.current.state.focusedEventId).toBe('event-a')
    expect(result.current.state.rangeStart).toBe(rangeStart)
    expect(result.current.state.rangeEnd).toBe(rangeEnd)
  })

  it('FOCUS_EVENT with null clears the focus', () => {
    const { result } = setup()
    act(() => result.current.dispatch({ type: 'FOCUS_EVENT', id: 'event-a' }))
    act(() => result.current.dispatch({ type: 'FOCUS_EVENT', id: null }))
    expect(result.current.state.focusedEventId).toBeNull()
  })

  it('HOVER_EVENT updates hoveredEventId independently of focus and range', () => {
    const { result } = setup()
    act(() => result.current.dispatch({ type: 'FOCUS_EVENT', id: 'event-a' }))
    act(() => result.current.dispatch({ type: 'HOVER_EVENT', id: 'event-b' }))

    expect(result.current.state.hoveredEventId).toBe('event-b')
    expect(result.current.state.focusedEventId).toBe('event-a')
  })

  it('SET_PROJECTION updates projectionType', () => {
    const { result } = setup()
    act(() =>
      result.current.dispatch({ type: 'SET_PROJECTION', projectionType: 'orthographic' }),
    )
    expect(result.current.state.projectionType).toBe('orthographic')
  })

  it('throws when the hooks are used outside a MapStoreProvider', () => {
    expect(() => renderHook(() => useMapState())).toThrow(
      'useMapState must be used within a MapStoreProvider',
    )
    expect(() => renderHook(() => useMapDispatch())).toThrow(
      'useMapDispatch must be used within a MapStoreProvider',
    )
  })
})
