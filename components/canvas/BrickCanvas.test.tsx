import type { LegoColor } from '@/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { BrickCanvas } from './BrickCanvas'

vi.mock('@/components/ui/pixelated-canvas', () => ({
  PixelatedCanvas: (props: { src: string; className?: string }) => (
    <canvas
      data-testid="pixelated-canvas"
      data-src={props.src}
      className={props.className}
    />
  ),
}))

describe('BrickCanvas', () => {
  test('renders empty state when matrix is empty', () => {
    render(
      <BrickCanvas
        matrix={[]}
        renderMode="stud"
        showGrid={false}
        cellSize={20}
        isBuilding={false}
        buildKey={0}
        onCellClick={vi.fn()}
      />
    )
    expect(screen.getByTestId('brick-canvas-empty')).toBeInTheDocument()
  })

  test('renders PixelatedCanvas and StudCell grid', () => {
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
        renderMode="stud"
        showGrid={false}
        cellSize={20}
        isBuilding={false}
        buildKey={0}
        onCellClick={vi.fn()}
      />
    )

    expect(screen.getByTestId('pixelated-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('brick-canvas-grid')).toBeInTheDocument()
    const cells = screen.getAllByRole('button', { name: 'Red' })
    expect(cells).toHaveLength(2)
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
      [mockColor, null],
      [null, mockColor],
    ]

    render(
      <BrickCanvas
        matrix={matrix}
        renderMode="stud"
        showGrid={false}
        cellSize={20}
        isBuilding={false}
        buildKey={0}
        onCellClick={onCellClick}
      />
    )

    const cells = screen.getAllByRole('button', { name: 'Red' })
    fireEvent.click(cells[0])
    expect(onCellClick).toHaveBeenCalledWith(0, 0)
  })
})
