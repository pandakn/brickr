import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsPanel } from './StatsPanel'
import React from 'react'
import type { PieceCount } from '@/types'

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
      percentage: 100
    }
  ]

  it('renders total pieces count correctly', () => {
    render(
      <StatsPanel 
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridSize={32}
        renderMode="stud"
      />
    )
    expect(screen.getAllByText('100')).toHaveLength(2) // Total and Breakdown row
  })

  it('calculates and displays estimated build time', () => {
    // 100 pieces * 15s / 60s = 25 minutes
    render(
      <StatsPanel 
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridSize={32}
        renderMode="stud"
      />
    )
    expect(screen.getByText(/≈ 25 min to build/i)).toBeInTheDocument()
  })

  it('shows fun message for large piece count', () => {
    const largePieceCounts: PieceCount[] = [
      {
        color: { id: 'red', name: 'Red', hex: '#FF0000', lab: [0, 0, 0] },
        count: 600,
        percentage: 100
      }
    ]
    render(
      <StatsPanel 
        pieceCounts={largePieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={[]}
        gridSize={32}
        renderMode="stud"
      />
    )
    expect(screen.getByText("That's a lot of bricks 👀")).toBeInTheDocument()
  })

  it('shows building status and progress', () => {
    render(
      <StatsPanel 
        pieceCounts={mockPieceCounts}
        isBuilding={true}
        buildProgress={0.5}
        matrix={[]}
        gridSize={32}
        renderMode="stud"
      />
    )
    expect(screen.getByText('Building…')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows export buttons when matrix is provided', () => {
    const mockMatrix = [[null]]
    render(
      <StatsPanel 
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={1}
        matrix={mockMatrix}
        gridSize={32}
        renderMode="stud"
      />
    )
    expect(screen.getByText(/Download art/i)).toBeInTheDocument()
    expect(screen.getByText(/Download guide/i)).toBeInTheDocument()
  })

  it('hides export buttons when matrix is null', () => {
    render(
      <StatsPanel 
        pieceCounts={mockPieceCounts}
        isBuilding={false}
        buildProgress={0}
        matrix={null}
        gridSize={32}
        renderMode="stud"
      />
    )
    expect(screen.queryByText(/Download art/i)).not.toBeInTheDocument()
  })
})
