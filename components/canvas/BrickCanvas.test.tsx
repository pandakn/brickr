import type { LegoColor } from '@/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { BrickCanvas } from './BrickCanvas'

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
    expect(screen.getByLabelText('Empty brick canvas')).toBeInTheDocument()
  })

  test('renders a grid of cells and handles clicks', () => {
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
    expect(cells).toHaveLength(2)

    // Click the first cell
    fireEvent.click(cells[0])
    expect(onCellClick).toHaveBeenCalledWith(0, 0)
  })
})
