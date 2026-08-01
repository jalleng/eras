import { fireEvent, render, screen } from '@testing-library/react'
import { geoEquirectangular } from 'd3-geo'
import { describe, expect, it, vi } from 'vitest'
import { EventMarkers } from './EventMarkers'
import type { HistoricalEvent } from '../../api/types'
import { colorForRegion } from '../../utils/colorScale'

const events: HistoricalEvent[] = [
  {
    id: 'philadelphia',
    title: 'Declaration of Independence adopted',
    description: 'Adopted in Philadelphia.',
    dateStart: '1776-07-04',
    dateEnd: null,
    latitude: 39.9496,
    longitude: -75.1503,
    region: 'North America',
    location: 'Philadelphia, Pennsylvania',
    wikipediaUrl: null,
  },
  {
    id: 'plymouth',
    title: 'Captain Cook departs on his third voyage',
    description: 'Departed from Plymouth.',
    dateStart: '1776-07-12',
    dateEnd: null,
    latitude: 50.3755,
    longitude: -4.1427,
    region: 'Europe',
    location: 'Plymouth, England',
    wikipediaUrl: null,
  },
]

const projection = geoEquirectangular().scale(100).translate([480, 250])

function renderMarkers(
  overrides: Partial<React.ComponentProps<typeof EventMarkers>> = {},
) {
  const onHoverEvent = vi.fn()
  const onFocusEvent = vi.fn()
  render(
    <svg>
      <EventMarkers
        events={events}
        projection={projection}
        hoveredEventId={null}
        focusedEventId={null}
        onHoverEvent={onHoverEvent}
        onFocusEvent={onFocusEvent}
        {...overrides}
      />
    </svg>,
  )
  return { onHoverEvent, onFocusEvent }
}

describe('EventMarkers', () => {
  it('renders one marker per event, labeled for accessibility', () => {
    renderMarkers()
    expect(
      screen.getByRole('button', {
        name: 'Declaration of Independence adopted, Philadelphia, Pennsylvania',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Captain Cook departs on his third voyage, Plymouth, England',
      }),
    ).toBeInTheDocument()
  })

  it('calls onHoverEvent with the event id on mouse enter, and null on mouse leave', () => {
    const { onHoverEvent } = renderMarkers()
    const marker = screen.getByRole('button', {
      name: /Declaration of Independence/,
    })

    fireEvent.mouseEnter(marker)
    expect(onHoverEvent).toHaveBeenCalledWith('philadelphia')

    fireEvent.mouseLeave(marker)
    expect(onHoverEvent).toHaveBeenCalledWith(null)
  })

  it('calls onFocusEvent when a marker is clicked', () => {
    const { onFocusEvent } = renderMarkers()
    fireEvent.click(screen.getByRole('button', { name: /Captain Cook/ }))
    expect(onFocusEvent).toHaveBeenCalledWith('plymouth')
  })

  it('calls onFocusEvent when a focused marker receives Enter', () => {
    const { onFocusEvent } = renderMarkers()
    const marker = screen.getByRole('button', {
      name: /Declaration of Independence/,
    })
    fireEvent.keyDown(marker, { key: 'Enter' })
    expect(onFocusEvent).toHaveBeenCalledWith('philadelphia')
  })

  it('is keyboard-focusable', () => {
    renderMarkers()
    const marker = screen.getByRole('button', {
      name: /Declaration of Independence/,
    })
    expect(marker).toHaveAttribute('tabindex', '0')
  })

  it('renders far-hemisphere events as ghosted and non-interactive, given a rotation', () => {
    // Center chosen so Philadelphia (~98° away) is on the far side of the
    // globe while Plymouth (~49° away) stays on the visible front.
    renderMarkers({ rotate: [-46.986, -21.4007, 0] })

    // aria-hidden="true" removes the element's accessible name, so it can't
    // be found via getByRole here — query the DOM directly instead.
    const philly = document.querySelector(
      '[aria-label^="Declaration of Independence"]',
    ) as SVGGElement
    expect(philly).toHaveAttribute('aria-hidden', 'true')
    expect(philly).toHaveAttribute('tabindex', '-1')
    const phillyCircle = philly.querySelector('circle:last-of-type')
    expect(phillyCircle).toHaveAttribute('fill', 'none')
    expect(phillyCircle).toHaveAttribute('stroke-dasharray', '2,2')

    const plymouth = screen.getByRole('button', { name: /Captain Cook/ })
    expect(plymouth).toHaveAttribute('aria-hidden', 'false')
    expect(plymouth).toHaveAttribute('tabindex', '0')
    const plymouthCircle = plymouth.querySelector('circle:last-of-type')
    expect(plymouthCircle).toHaveAttribute('fill', colorForRegion('Europe'))
    expect(plymouthCircle).not.toHaveAttribute('stroke-dasharray')
  })
})
