import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventsForRange } from './useEventsForRange'
import { useDebouncedValue } from './useDebouncedValue'
import type { HistoricalEvent } from '../api/types'

const EVENT: HistoricalEvent = {
  id: '1776-declaration-of-independence',
  title: 'Declaration of Independence adopted',
  description: 'Adopted in Philadelphia.',
  dateStart: '1776-07-04',
  dateEnd: null,
  latitude: 39.9496,
  longitude: -75.1503,
  region: 'North America',
  location: 'Philadelphia, Pennsylvania',
  wikipediaUrl: null,
}

function stubFetch() {
  return vi.fn<typeof fetch>(async () => {
    return new Response(JSON.stringify([EVENT]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

describe('useEventsForRange', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the range endpoint with both start and end dates', async () => {
    const fetchMock = stubFetch()
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useEventsForRange('1776-06-28', '1776-07-12'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url] = fetchMock.mock.calls[0]
    expect(url.toString()).toContain('start_date=1776-06-28')
    expect(url.toString()).toContain('end_date=1776-07-12')
  })

  it('re-fetches whenever the range changes', async () => {
    const fetchMock = stubFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderHook(
      ({ start, end }) => useEventsForRange(start, end),
      { initialProps: { start: '1776-06-28', end: '1776-07-12' } },
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    rerender({ start: '1941-12-07', end: '1941-12-08' })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const [secondUrl] = fetchMock.mock.calls[1]
    expect(secondUrl.toString()).toContain('start_date=1941-12-07')
    expect(secondUrl.toString()).toContain('end_date=1941-12-08')
  })

  it('resolves with the fetched events and clears the loading state', async () => {
    vi.stubGlobal('fetch', stubFetch())

    const { result } = renderHook(() => useEventsForRange('1776-06-28', '1776-07-12'))

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.events).toEqual([EVENT])
    expect(result.current.error).toBeNull()
  })
})

describe('useEventsForRange composed with useDebouncedValue (the intended usage pattern)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not fire a new request on every intermediate value while dragging, only once debounced', async () => {
    const fetchMock = stubFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { rerender } = renderHook(
      ({ start, end }) => {
        const debouncedStart = useDebouncedValue(start, 250)
        const debouncedEnd = useDebouncedValue(end, 250)
        return useEventsForRange(debouncedStart, debouncedEnd)
      },
      { initialProps: { start: '1776-06-28', end: '1776-07-12' } },
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Simulate dragging quickly through several intermediate positions.
    rerender({ start: '1776-06-29', end: '1776-07-12' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    rerender({ start: '1776-06-30', end: '1776-07-12' })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })
    rerender({ start: '1776-07-01', end: '1776-07-12' })

    // Only 100ms have passed since the last drag tick, well under the
    // 250ms debounce, so no new request should have gone out yet.
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250)
    })

    // Settles once, on the final value only.
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [lastUrl] = fetchMock.mock.calls[1]
    expect(lastUrl.toString()).toContain('start_date=1776-07-01')
  })
})
