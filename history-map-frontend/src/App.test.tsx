import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { HistoricalEvent } from './api/types'

const DECLARATION_EVENT: HistoricalEvent = {
  id: '1776-declaration-of-independence',
  title: 'Declaration of Independence adopted',
  description: 'Adopted in Philadelphia.',
  dateStart: '1776-07-04',
  dateEnd: null,
  latitude: 39.9496,
  longitude: -75.1503,
  region: 'North America',
  location: 'Philadelphia, Pennsylvania',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence',
}

const PEARL_HARBOR_EVENT: HistoricalEvent = {
  id: '1941-pearl-harbor',
  title: 'Attack on Pearl Harbor',
  description: 'Attack on the U.S. Pacific Fleet.',
  dateStart: '1941-12-07',
  dateEnd: null,
  latitude: 21.3469,
  longitude: -157.9583,
  region: 'North America',
  location: 'Pearl Harbor, Oahu, Hawaii',
  wikipediaUrl: null,
}

// Deliberately dated OUTSIDE the Declaration cluster's featured range
// (1776-06-28..1776-07-12), so a test can prove the concurrent-moment view
// ignores the visible range's width entirely.
const OUT_OF_RANGE_CONCURRENT_EVENT: HistoricalEvent = {
  id: 'out-of-range-concurrent-event',
  title: 'Some other concurrent happening',
  description: 'Happens well after the Declaration cluster window.',
  dateStart: '1776-08-01',
  dateEnd: null,
  latitude: 48.8566,
  longitude: 2.3522,
  region: 'Europe',
  location: 'Paris, France',
  wikipediaUrl: null,
}

describe('App', () => {
  beforeEach(() => {
    // api/events.ts calls the real backend via fetch; stub it here so the
    // test suite stays hermetic and doesn't require a live server.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const urlString = url.toString()
        const respond = (body: unknown) =>
          new Response(JSON.stringify(body), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })

        if (urlString.includes(`/events/${DECLARATION_EVENT.id}/concurrent`)) {
          return respond([OUT_OF_RANGE_CONCURRENT_EVENT])
        }
        if (urlString.includes(`/events/${DECLARATION_EVENT.id}`)) {
          return respond(DECLARATION_EVENT)
        }
        if (urlString.includes('start_date=1776-06-28')) {
          return respond([DECLARATION_EVENT])
        }
        if (urlString.includes('start_date=1941-12-07')) {
          return respond([PEARL_HARBOR_EVENT])
        }
        return respond([])
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the default featured range and its events by default', async () => {
    render(<App />)
    expect(screen.getByText('June 28 – July 12, 1776')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Declaration of Independence adopted/,
        }),
      ).toBeInTheDocument()
    })
  })

  it('updates the visible events after jumping to a different featured range', async () => {
    render(<App />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Declaration of Independence adopted/,
        }),
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Opening of the Pacific War' }),
    )

    expect(screen.getByText('December 7 – December 8, 1941')).toBeInTheDocument()

    // The debounced event fetch needs its timer to elapse before the map updates.
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /Attack on Pearl Harbor/ }),
        ).toBeInTheDocument()
      },
      { timeout: 2000 },
    )

    expect(
      screen.queryByRole('button', {
        name: /Declaration of Independence adopted/,
      }),
    ).not.toBeInTheDocument()
  })

  it('clicking an event marker focuses it and shows its concurrent-moment view, independent of the visible range', async () => {
    render(<App />)

    const marker = await screen.findByRole('button', {
      name: /Declaration of Independence adopted/,
    })
    fireEvent.click(marker)

    await waitFor(() => {
      expect(screen.getByLabelText('Event details')).toBeInTheDocument()
    })

    // The concurrent event is dated 1776-08-01, outside the visible
    // 1776-06-28..07-12 range -- it still shows up, because the concurrent
    // view is scoped to the focused event's own cluster, not the range.
    await waitFor(() => {
      expect(
        screen.getByText('Some other concurrent happening'),
      ).toBeInTheDocument()
    })
  })

  it('clears the focused event once the range is changed away from it, but not before', async () => {
    render(<App />)

    const marker = await screen.findByRole('button', {
      name: /Declaration of Independence adopted/,
    })
    fireEvent.click(marker)
    await waitFor(() => {
      expect(screen.getByLabelText('Event details')).toBeInTheDocument()
    })

    // Jumping to the Pacific War window no longer overlaps the Declaration
    // event's own date (1776-07-04), so the focus should clear.
    fireEvent.click(
      screen.getByRole('button', { name: 'Opening of the Pacific War' }),
    )

    await waitFor(() => {
      expect(screen.queryByLabelText('Event details')).not.toBeInTheDocument()
    })
  })
})
