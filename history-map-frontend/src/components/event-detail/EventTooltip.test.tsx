import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EventTooltip } from './EventTooltip'
import type { HistoricalEvent } from '../../api/types'

const sampleEvent: HistoricalEvent = {
  id: '1776-declaration-of-independence',
  title: 'Declaration of Independence adopted',
  description:
    'The Second Continental Congress formally adopts the Declaration.',
  dateStart: '1776-07-04',
  dateEnd: null,
  latitude: 39.9496,
  longitude: -75.1503,
  region: 'North America',
  location: 'Philadelphia, Pennsylvania',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/United_States_Declaration_of_Independence',
}

describe('EventTooltip', () => {
  it('renders nothing when there is no hovered event', () => {
    render(<EventTooltip event={null} position={{ x: 0, y: 0 }} />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders nothing when there is no position', () => {
    render(<EventTooltip event={sampleEvent} position={null} />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the event title, location, region, and description when hovered', () => {
    render(<EventTooltip event={sampleEvent} position={{ x: 100, y: 50 }} />)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Declaration of Independence adopted')
    expect(tooltip).toHaveTextContent('Philadelphia, Pennsylvania')
    expect(tooltip).toHaveTextContent('North America')
    expect(tooltip).toHaveTextContent(
      'The Second Continental Congress formally adopts the Declaration.',
    )
  })
})
