import type { LegoColor } from '@/types'
import { useBrickCanvas } from '@/hooks/useBrickCanvas'
import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
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

const mockColor: LegoColor = {
  id: 'red',
  name: 'Red',
  hex: '#FF0000',
  lab: [0, 0, 0],
}

/**
 * Real hook + real canvas: exercises the remove → restore round trip the way
 * the page composes them (the hook owns the original matrix for restoration).
 */
function RestorableCanvas() {
  const { state, loadImage, handleCellClick } = useBrickCanvas()

  useEffect(() => {
    loadImage([[mockColor]], new ImageData(new Uint8ClampedArray(4), 1, 1))
  }, [loadImage])

  return (
    <BrickCanvas
      matrix={state.pixelMatrix}
      renderMode="stud"
      showGrid={false}
      cellSize={20}
      isBuilding={state.isBuilding}
      buildKey={0}
      onCellClick={handleCellClick}
    />
  )
}

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

  test('renders empty cells as focusable, labelled buttons in place', () => {
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

    const emptyCells = screen.getAllByRole('button', { name: 'Empty position' })
    expect(emptyCells).toHaveLength(2)
    expect(screen.getAllByRole('button')).toHaveLength(4)
    emptyCells.forEach((cell) => {
      expect(cell).toHaveAttribute('tabindex', '0')
    })
  })

  test('clicking an empty cell reports its own coordinates', () => {
    const onCellClick = vi.fn()
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

    const emptyCells = screen.getAllByRole('button', { name: 'Empty position' })
    fireEvent.click(emptyCells[0])
    expect(onCellClick).toHaveBeenCalledWith(0, 1)

    fireEvent.click(emptyCells[1])
    expect(onCellClick).toHaveBeenCalledWith(1, 0)
  })

  test('restores a removed brick by clicking its empty position', () => {
    render(<RestorableCanvas />)

    fireEvent.click(screen.getByRole('button', { name: 'Red' }))
    expect(
      screen.queryByRole('button', { name: 'Red' })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Empty position' }))
    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument()
  })

  test('removes and restores a brick from the keyboard without re-processing', () => {
    render(<RestorableCanvas />)

    fireEvent.keyDown(screen.getByRole('button', { name: 'Red' }), {
      key: 'Enter',
    })
    const empty = screen.getByRole('button', { name: 'Empty position' })

    fireEvent.keyDown(empty, { key: ' ' })
    expect(screen.getByRole('button', { name: 'Red' })).toBeInTheDocument()
    expect(screen.getByTestId('pixelated-canvas')).toBeInTheDocument()
  })
})
