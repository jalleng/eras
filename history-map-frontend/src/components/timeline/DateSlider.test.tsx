import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateSlider } from './DateSlider'

const ABSOLUTE_MIN_DATE = '1700-01-01'
const ABSOLUTE_MAX_DATE = '2024-01-01'

describe('DateSlider', () => {
  it('renders two independent thumbs with distinct accessible labels', () => {
    render(
      <DateSlider
        rangeStart="1776-06-28"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={() => {}}
      />,
    )
    expect(
      screen.getByRole('slider', { name: 'Range start date' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('slider', { name: 'Range end date' }),
    ).toBeInTheDocument()
  })

  it('exposes each thumb\'s current value via aria-valuetext', () => {
    render(
      <DateSlider
        rangeStart="1776-06-28"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('slider', { name: 'Range start date' })).toHaveAttribute(
      'aria-valuetext',
      'June 28, 1776',
    )
    expect(screen.getByRole('slider', { name: 'Range end date' })).toHaveAttribute(
      'aria-valuetext',
      'July 12, 1776',
    )
  })

  it('moves the start handle independently via the keyboard (arrow keys)', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider
        rangeStart="1776-06-28"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={handleChange}
      />,
    )
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range start date' }), {
      key: 'ArrowRight',
    })
    expect(handleChange).toHaveBeenCalledWith('1776-06-29', '1776-07-12')
  })

  it('moves the end handle independently via the keyboard (arrow keys)', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider
        rangeStart="1776-06-28"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={handleChange}
      />,
    )
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range end date' }), {
      key: 'ArrowLeft',
    })
    expect(handleChange).toHaveBeenCalledWith('1776-06-28', '1776-07-11')
  })

  it('defaults the minimum gap to 1 day and stops the start handle from crossing the end handle', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider
        // Exactly the default 1-day minimum gap apart.
        rangeStart="1776-07-11"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={handleChange}
      />,
    )
    // Pushing the start handle forward would close the gap to zero.
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range start date' }), {
      key: 'ArrowRight',
    })
    expect(handleChange).toHaveBeenCalledWith('1776-07-11', '1776-07-12')
  })

  it('stops the end handle from crossing the start handle', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider
        rangeStart="1776-07-11"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={handleChange}
      />,
    )
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range end date' }), {
      key: 'ArrowLeft',
    })
    expect(handleChange).toHaveBeenCalledWith('1776-07-11', '1776-07-12')
  })

  it('honors a custom minGapDays prop rather than a hardcoded 1-day gap', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider
        rangeStart="1776-07-05"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        minGapDays={7}
        onChange={handleChange}
      />,
    )
    // Already exactly at the 7-day minimum -- one more day should clamp.
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range start date' }), {
      key: 'ArrowRight',
    })
    expect(handleChange).toHaveBeenCalledWith('1776-07-05', '1776-07-12')
  })

  it('allows normal movement when the gap has room to spare', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider
        rangeStart="1776-06-28"
        rangeEnd="1776-07-12"
        absoluteMinDate={ABSOLUTE_MIN_DATE}
        absoluteMaxDate={ABSOLUTE_MAX_DATE}
        onChange={handleChange}
      />,
    )
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Range end date' }), {
      key: 'ArrowLeft',
    })
    expect(handleChange).toHaveBeenCalledWith('1776-06-28', '1776-07-11')
  })
})
