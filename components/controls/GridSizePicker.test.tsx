import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GridSizePicker } from './GridSizePicker'

describe('GridSizePicker', () => {
  test('renders all size options', () => {
    const onChange = vi.fn()
    render(<GridSizePicker value={32} onChange={onChange} />)

    expect(screen.getByTestId('grid-size-12')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-25')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-32')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-40')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-64')).toBeInTheDocument()
  })

  test('marks the current value as active', () => {
    const onChange = vi.fn()
    render(<GridSizePicker value={32} onChange={onChange} />)

    const activeBtn = screen.getByTestId('grid-size-32')
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true')

    const inactiveBtn = screen.getByTestId('grid-size-64')
    expect(inactiveBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('calls onChange when a size is clicked', () => {
    const onChange = vi.fn()
    render(<GridSizePicker value={32} onChange={onChange} />)

    fireEvent.click(screen.getByTestId('grid-size-64'))

    expect(onChange).toHaveBeenCalledWith(64)
  })
})
