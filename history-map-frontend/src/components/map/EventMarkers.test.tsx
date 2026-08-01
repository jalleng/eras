import { fireEvent, render, screen } from '@testing-library/react'
import { geoEquirectangular } from 'd3-geo'
import { describe, expect, it, vi } from 'vitest'
import { EventMarkers } from './EventMarkers'
import type { HistoricalEvent } from '../../api/types'

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
  const onSelectEvent = vi.fn()
  render(
    <svg>
      <EventMarkers
        events={events}
        projection={projection}
        hoveredEventId={null}
        selectedEventId={null}
        onHoverEvent={onHoverEvent}
        onSelectEvent={onSelectEvent}
        {...overrides}
      />
    </svg>,
  )
  return { onHoverEvent, onSelectEvent }
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

  it('calls onSelectEvent when a marker is clicked', () => {
    const { onSelectEvent } = renderMarkers()
    fireEvent.click(screen.getByRole('button', { name: /Captain Cook/ }))
    expect(onSelectEvent).toHaveBeenCalledWith('plymouth')
  })

  it('calls onSelectEvent when a focused marker receives Enter', () => {
    const { onSelectEvent } = renderMarkers()
    const marker = screen.getByRole('button', {
      name: /Declaration of Independence/,
    })
    fireEvent.keyDown(marker, { key: 'Enter' })
    expect(onSelectEvent).toHaveBeenCalledWith('philadelphia')
  })

  it('is keyboard-focusable', () => {
    renderMarkers()
    const marker = screen.getByRole('button', {
      name: /Declaration of Independence/,
    })
    expect(marker).toHaveAttribute('tabindex', '0')
  })
})
