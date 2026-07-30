import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DateSlider } from './DateSlider'
import type { CuratedDateEntry } from '../../api/types'

const dates: CuratedDateEntry[] = [
  { isoDate: '1776-07-04', label: 'Declaration of Independence' },
  { isoDate: '1941-12-07', label: 'Opening of the Pacific War' },
  { isoDate: '1962-10-27', label: 'Black Saturday' },
]

describe('DateSlider', () => {
  it('renders a range input spanning all curated dates', () => {
    render(<DateSlider dates={dates} selectedIndex={0} onChange={() => {}} />)
    const slider = screen.getByRole('slider')
    expect(slider).toHaveAttribute('min', '0')
    expect(slider).toHaveAttribute('max', '2')
    expect(slider).toHaveValue('0')
  })

  it('reflects the selected index as the current value', () => {
    render(<DateSlider dates={dates} selectedIndex={1} onChange={() => {}} />)
    expect(screen.getByRole('slider')).toHaveValue('1')
  })

  it('calls onChange with the new index when moved', () => {
    const handleChange = vi.fn()
    render(
      <DateSlider dates={dates} selectedIndex={0} onChange={handleChange} />,
    )
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } })
    expect(handleChange).toHaveBeenCalledWith(2)
  })

  it('exposes the human-readable date via aria-valuetext for screen readers', () => {
    render(<DateSlider dates={dates} selectedIndex={1} onChange={() => {}} />)
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'December 7, 1941',
    )
  })
})
