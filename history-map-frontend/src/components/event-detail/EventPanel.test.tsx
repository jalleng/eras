import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EventPanel } from './EventPanel'
import type { HistoricalEvent } from '../../api/types'

const SINGLE_DAY_EVENT: HistoricalEvent = {
  id: '1941-pearl-harbor',
  title: 'Attack on Pearl Harbor',
  description: 'Attack on the U.S. Pacific Fleet.',
  dateStart: '1941-12-07',
  dateEnd: null,
  latitude: 21.3469,
  longitude: -157.9583,
  region: 'North America',
  location: 'Pearl Harbor, Oahu, Hawaii',
  wikipediaUrl: 'https://en.wikipedia.org/wiki/Attack_on_Pearl_Harbor',
}

const MULTI_DAY_EVENT: HistoricalEvent = {
  id: 'cluster-1776-declaration-of-independence',
  title: 'Declaration of Independence adopted',
  description: 'Adopted in Philadelphia.',
  dateStart: '1776-06-28',
  dateEnd: '1776-07-12',
  latitude: 39.9496,
  longitude: -75.1503,
  region: 'North America',
  location: 'Philadelphia, Pennsylvania',
  wikipediaUrl: null,
}

const noop = () => {}

describe('EventPanel', () => {
  it('renders nothing when there is no selected event', () => {
    render(
      <EventPanel
        event={null}
        concurrentEvents={[]}
        hoveredEventId={null}
        onHoverEvent={noop}
        onFocusEvent={noop}
        onClose={noop}
      />,
    )
    expect(screen.queryByLabelText('Event details')).not.toBeInTheDocument()
  })

  it('shows a single date when dateEnd is absent', () => {
    render(
      <EventPanel
        event={SINGLE_DAY_EVENT}
        concurrentEvents={[]}
        hoveredEventId={null}
        onHoverEvent={noop}
        onFocusEvent={noop}
        onClose={noop}
      />,
    )
    expect(screen.getByText('December 7, 1941')).toBeInTheDocument()
  })

  it('shows a formatted date range when dateEnd is present', () => {
    render(
      <EventPanel
        event={MULTI_DAY_EVENT}
        concurrentEvents={[]}
        hoveredEventId={null}
        onHoverEvent={noop}
        onFocusEvent={noop}
        onClose={noop}
      />,
    )
    expect(screen.getByText('June 28 – July 12, 1776')).toBeInTheDocument()
  })

  it('renders a Wikipedia link that opens in a new tab safely when wikipediaUrl is set', () => {
    render(
      <EventPanel
        event={SINGLE_DAY_EVENT}
        concurrentEvents={[]}
        hoveredEventId={null}
        onHoverEvent={noop}
        onFocusEvent={noop}
        onClose={noop}
      />,
    )
    const link = screen.getByRole('link', { name: 'Read more on Wikipedia' })
    expect(link).toHaveAttribute('href', SINGLE_DAY_EVENT.wikipediaUrl)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('hides the Wikipedia link entirely when wikipediaUrl is null', () => {
    render(
      <EventPanel
        event={MULTI_DAY_EVENT}
        concurrentEvents={[]}
        hoveredEventId={null}
        onHoverEvent={noop}
        onFocusEvent={noop}
        onClose={noop}
      />,
    )
    expect(
      screen.queryByRole('link', { name: 'Read more on Wikipedia' }),
    ).not.toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <EventPanel
        event={SINGLE_DAY_EVENT}
        concurrentEvents={[]}
        hoveredEventId={null}
        onHoverEvent={noop}
        onFocusEvent={noop}
        onClose={onClose}
      />,
    )
    screen.getByLabelText('Close event details').click()
    expect(onClose).toHaveBeenCalled()
  })
})
