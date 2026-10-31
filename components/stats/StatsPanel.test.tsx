import type { GridDimensions, LegoColor, PieceCount } from '@/types'
import { computePieceCounts } from '@/lib/imageProcessor'
import { exportAsImage, exportBuildGuide } from '@/lib/exportCanvas'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { StatsPanel } from './StatsPanel'

// Mock the export functions to avoid actual canvas logic
vi.mock('@/lib/exportCanvas', () => ({
  exportAsImage: vi.fn(),
  exportBuildGuide: vi.fn(),
}))

const GRID: GridDimensions = { width: 32, height: 32 }

const red: LegoColor = {
  id: 'red',
  name: 'Bright Red',
  hex: '#FF0000',
  lab: [0, 0, 0],
}
const blue: LegoColor = {
  id: 'blue',
  name: 'Bright Blue',
  hex: '#0000FF',
  lab: [0, 0, 0],
}

/** Mirrors app/page.tsx: counts always come from the committed matrix. */
function statsProps(matrix: (LegoColor | null)[][]) {
  return {
    pieceCounts: computePieceCounts(matrix),
    isBuilding: false,
    buildProgress: 0,
    matrix,
    gridDimensions: GRID,
    renderMode: 'stud' as const,
  }
}

describe('StatsPanel', () => {
  const mockPieceCounts: PieceCount[] = [
    {
      color: { id: 'red', name: 'Bright Red', hex: '#FF0000', lab: [0, 0, 0] },
      count: 100,
      percentage: 100,
    },
  ]

  test('renders total pieces count correctly', () => {
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('total-pieces')).toHaveTextContent('100')
  })

  test('shows dash when no pieces', () => {
    render(
      <StatsPanel
        pieceCounts={[]}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('total-pieces')).toHaveTextContent('—')
  })

  test('calculates and displays estimated build time', () => {
    // 100 pieces * 15s / 60s = 25 minutes
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('build-time')).toHaveTextContent(
      '≈ 25 min to build'
    )
  })

  test('hides build time when there are no pieces', () => {
    render(
      <StatsPanel
        pieceCounts={[]}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.queryByTestId('build-time')).not.toBeInTheDocument()
  })

  test('shows fun message for large piece count', () => {
    const largePieceCounts: PieceCount[] = [
      {
        color: { id: 'red', name: 'Red', hex: '#FF0000', lab: [0, 0, 0] },
        count: 600,
        percentage: 100,
      },
    ]
    render(
      <StatsPanel
        pieceCounts={largePieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('fun-message')).toHaveTextContent(
      "That's a lot of bricks 👀"
    )
  })

  test('does not show fun message for small piece count', () => {
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.queryByTestId('fun-message')).not.toBeInTheDocument()
  })

  test('shows building status and progress', () => {
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={true}
        buildProgress={0.5}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('build-status')).toHaveTextContent('Building…')
    expect(screen.getByTestId('build-progress-percent')).toHaveTextContent(
      '50%'
    )
    expect(screen.getByTestId('build-progress-bar')).toBeInTheDocument()
  })

  test('shows done status when build is complete', () => {
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={1}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('build-status')).toHaveTextContent('Done')
    expect(screen.getByTestId('build-progress-percent')).toHaveTextContent(
      '100%'
    )
  })

  test('hides build progress when not building and progress is 0', () => {
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.queryByTestId('build-status')).not.toBeInTheDocument()
    expect(screen.queryByTestId('build-progress-bar')).not.toBeInTheDocument()
  })

  test('shows export buttons when matrix is provided', () => {
    const mockMatrix = [[null]]
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={1}
        matrix={mockMatrix}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.getByTestId('export-image-button')).toBeInTheDocument()
    expect(screen.getByTestId('export-guide-button')).toBeInTheDocument()
  })

  test('hides export buttons when matrix is null', () => {
    render(
      <StatsPanel
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={null}
        gridDimensions={{ width: 32, height: 32 }}
        renderMode="stud"
      />
    )
    expect(screen.queryByTestId('export-image-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('export-guide-button')).not.toBeInTheDocument()
  })

  test('excludes empty cells from totals, colour counts and build time', () => {
    // 4x4 grid with two removed cells → 14 physical bricks, not 16
    const matrix: (LegoColor | null)[][] = [
      [red, red, red, red],
      [red, red, red, red],
      [red, red, red, red],
      [red, blue, null, null],
    ]

    render(<StatsPanel {...statsProps(matrix)} />)

    expect(screen.getByTestId('total-pieces')).toHaveTextContent('14')
    expect(screen.getByTestId('color-count-red')).toHaveTextContent('13')
    expect(screen.getByTestId('color-count-blue')).toHaveTextContent('1')
    // 14 * 15s / 60s = 3.5 → rounded to 4 minutes
    expect(screen.getByTestId('build-time')).toHaveTextContent(
      '≈ 4 min to build'
    )
  })

  test('updates totals when a brick is removed and restores them on undo', () => {
    const before: (LegoColor | null)[][] = [
      [red, red],
      [red, blue],
    ]
    const { rerender } = render(<StatsPanel {...statsProps(before)} />)

    expect(screen.getByTestId('total-pieces')).toHaveTextContent('4')
    expect(screen.getByTestId('color-count-red')).toHaveTextContent('3')

    // Remove one red cell
    const afterRemoval: (LegoColor | null)[][] = [
      [red, red],
      [null, blue],
    ]
    rerender(<StatsPanel {...statsProps(afterRemoval)} />)

    expect(screen.getByTestId('total-pieces')).toHaveTextContent('3')
    expect(screen.getByTestId('color-count-red')).toHaveTextContent('2')
    expect(screen.getByTestId('color-count-blue')).toHaveTextContent('1')
    // 3 * 15s / 60s = 0.75 → rounded to 1 minute
    expect(screen.getByTestId('build-time')).toHaveTextContent(
      '≈ 1 min to build'
    )

    // Restore it — every number returns to its original value
    rerender(<StatsPanel {...statsProps(before)} />)

    expect(screen.getByTestId('total-pieces')).toHaveTextContent('4')
    expect(screen.getByTestId('color-count-red')).toHaveTextContent('3')
    expect(screen.getByTestId('build-time')).toHaveTextContent(
      '≈ 1 min to build'
    )
  })

  test('exports the same committed matrix that produced the stats', () => {
    const matrix: (LegoColor | null)[][] = [
      [red, null],
      [null, blue],
    ]

    render(<StatsPanel {...statsProps(matrix)} />)

    // 2 physical bricks despite a 4-cell grid
    expect(screen.getByTestId('total-pieces')).toHaveTextContent('2')

    fireEvent.click(screen.getByTestId('export-image-button'))
    expect(exportAsImage).toHaveBeenCalledWith(matrix, 'stud', 16)

    fireEvent.click(screen.getByTestId('export-guide-button'))
    expect(exportBuildGuide).toHaveBeenCalledWith(matrix, GRID)
  })
})
