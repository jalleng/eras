import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { HistoricalEvent } from './api/types'

const DECLARATION_EVENT: HistoricalEvent = {
  id: '1776-declaration-of-independence',
  title: 'Declaration of Independence adopted',
  description: 'Adopted in Philadelphia.',
  isoDate: '1776-07-04',
  latitude: 39.9496,
  longitude: -75.1503,
  region: 'North America',
  location: 'Philadelphia, Pennsylvania',
}

const PEARL_HARBOR_EVENT: HistoricalEvent = {
  id: '1941-pearl-harbor',
  title: 'Attack on Pearl Harbor',
  description: 'Attack on the U.S. Pacific Fleet.',
  isoDate: '1941-12-07',
  latitude: 21.3469,
  longitude: -157.9583,
  region: 'North America',
  location: 'Pearl Harbor, Oahu, Hawaii',
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
    fireEvent.change(slider, { target: { value: '1' } })

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
