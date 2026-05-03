import type { LegoColor } from '@/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { BrickCanvas } from './BrickCanvas'

vi.mock('@/components/ui/pixelated-canvas', () => ({
  PixelatedCanvas: (props: { src: string; className?: string }) => (
    <canvas data-testid="pixelated-canvas" data-src={props.src} className={props.className} />
  ),
}))

describe('BrickCanvas', () => {
  test('renders empty state when matrix is empty', () => {
    render(
      <BrickCanvas
        matrix={[]}
        showGrid={false}
        cellSize={20}
        onCellClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('brick-canvas-empty')).toBeInTheDocument()
  })

  test('renders PixelatedCanvas with the matrix data URL', () => {
    const mockColor: LegoColor = {
      id: 'red',
      name: 'Red',
      hex: '#FF0000',
      lab: [0, 0, 0],
    }
    const matrix: (LegoColor | null)[][] = [
      [mockColor, null],
      [null, mockColor],
    ]

    render(
      <BrickCanvas
        matrix={matrix}
        showGrid={false}
        cellSize={20}
        onCellClick={vi.fn()}
      />
    )

    expect(screen.getByTestId('pixelated-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('brick-canvas-grid')).toBeInTheDocument()
  })

  test('calls onCellClick with correct row and col on click', () => {
    const onCellClick = vi.fn()
    const mockColor: LegoColor = {
      id: 'red',
      name: 'Red',
      hex: '#FF0000',
      lab: [0, 0, 0],
    }
    const matrix: (LegoColor | null)[][] = [
      [mockColor, mockColor],
      [mockColor, mockColor],
    ]

    render(
      <BrickCanvas
        matrix={matrix}
        showGrid={false}
        cellSize={50}
        onCellClick={onCellClick}
      />
    )

    const grid = screen.getByTestId('brick-canvas-grid')
    // Simulate a click at position that maps to row 0, col 0
    fireEvent.click(grid, { clientX: 10, clientY: 10 })
    expect(onCellClick).toHaveBeenCalledWith(0, 0)
  })
})
