import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
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
