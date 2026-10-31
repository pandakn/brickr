import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { GridDimensionsPicker } from './GridDimensionsPicker'

describe('GridDimensionsPicker', () => {
  test('renders all square preset options', () => {
    const onChange = vi.fn()
    render(
      <GridDimensionsPicker
        value={{ width: 32, height: 32 }}
        onChange={onChange}
      />
    )

    expect(screen.getByTestId('grid-size-12')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-25')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-32')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-40')).toBeInTheDocument()
    expect(screen.getByTestId('grid-size-64')).toBeInTheDocument()
  })

  test('renders width and height axis rows', () => {
    const onChange = vi.fn()
    render(
      <GridDimensionsPicker
        value={{ width: 32, height: 32 }}
        onChange={onChange}
      />
    )

    expect(screen.getByTestId('grid-width-32')).toBeInTheDocument()
    expect(screen.getByTestId('grid-height-32')).toBeInTheDocument()
  })

  test('marks the current square preset as active', () => {
    const onChange = vi.fn()
    render(
      <GridDimensionsPicker
        value={{ width: 32, height: 32 }}
        onChange={onChange}
      />
    )

    const activeBtn = screen.getByTestId('grid-size-32')
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true')

    const inactiveBtn = screen.getByTestId('grid-size-64')
    expect(inactiveBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('calls onChange with square dimensions when preset clicked', () => {
    const onChange = vi.fn()
    render(
      <GridDimensionsPicker
        value={{ width: 32, height: 32 }}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByTestId('grid-size-64'))

    expect(onChange).toHaveBeenCalledWith({ width: 64, height: 64 })
  })

  test('calls onChange with updated width when width axis clicked', () => {
    const onChange = vi.fn()
    render(
      <GridDimensionsPicker
        value={{ width: 32, height: 40 }}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByTestId('grid-width-64'))

    expect(onChange).toHaveBeenCalledWith({ width: 64, height: 40 })
  })

  test('calls onChange with updated height when height axis clicked', () => {
    const onChange = vi.fn()
    render(
      <GridDimensionsPicker
        value={{ width: 32, height: 40 }}
        onChange={onChange}
      />
    )

    fireEvent.click(screen.getByTestId('grid-height-12'))

    expect(onChange).toHaveBeenCalledWith({ width: 32, height: 12 })
  })
})
