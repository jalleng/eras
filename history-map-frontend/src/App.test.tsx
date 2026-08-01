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

describe('App', () => {
  beforeEach(() => {
    // getEventsForDate now calls the real backend via fetch; stub it here so
    // the test suite stays hermetic and doesn't require a live server.
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const urlString = url.toString()
        const events = urlString.includes('start_date=1776-07-04')
          ? [DECLARATION_EVENT]
          : urlString.includes('start_date=1941-12-07')
            ? [PEARL_HARBOR_EVENT]
            : []
        return new Response(JSON.stringify(events), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the first curated date and its events by default', async () => {
    render(<App />)
    expect(screen.getByText('July 4, 1776')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Declaration of Independence adopted/,
        }),
      ).toBeInTheDocument()
    })
  })

  it('updates the visible events after selecting a different date on the slider', async () => {
    render(<App />)

    // Sanity check: the earlier date's marker is present before switching.
    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /Declaration of Independence adopted/,
        }),
      ).toBeInTheDocument()
    })

    const slider = screen.getByRole('slider', { name: /select a date/i })
    // Index 2: 0=Declaration of Independence (1776), 1=Battle of Waterloo (1815), 2=Pearl Harbor (1941).
    fireEvent.change(slider, { target: { value: '2' } })

    expect(screen.getByText('December 7, 1941')).toBeInTheDocument()

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
})
