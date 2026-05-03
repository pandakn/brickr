import type { PieceCount } from '@/types'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { StatsPanel } from './StatsPanel'

// Mock the export functions to avoid actual canvas logic
vi.mock('@/lib/exportCanvas', () => ({
  exportAsImage: vi.fn(),
  exportBuildGuide: vi.fn(),
}))

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
})
