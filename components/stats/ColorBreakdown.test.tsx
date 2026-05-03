import type { PieceCount } from '@/types'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { ColorBreakdown } from './ColorBreakdown'

describe('ColorBreakdown', () => {
  test('renders empty state message when no piece counts', () => {
    render(<ColorBreakdown pieceCounts={[]} />)
    expect(
      screen.getByTestId('color-breakdown-empty-state')
    ).toBeInTheDocument()
  })

  test('renders a list of colors and counts', () => {
    const mockPieceCounts: PieceCount[] = [
      {
        color: {
          id: 'red',
          name: 'Bright Red',
          hex: '#FF0000',
          lab: [0, 0, 0],
        },
        count: 10,
        percentage: 50,
      },
      {
        color: {
          id: 'blue',
          name: 'Bright Blue',
          hex: '#0000FF',
          lab: [0, 0, 0],
        },
        count: 10,
        percentage: 50,
      },
    ]

    render(<ColorBreakdown pieceCounts={mockPieceCounts} />)

    expect(screen.getByTestId('color-row-red')).toBeInTheDocument()
    expect(screen.getByTestId('color-row-blue')).toBeInTheDocument()
    expect(screen.getByTestId('color-name-red')).toHaveTextContent('Bright Red')
    expect(screen.getByTestId('color-name-blue')).toHaveTextContent(
      'Bright Blue'
    )
    expect(screen.getByTestId('color-count-red')).toHaveTextContent('10')
    expect(screen.getByTestId('color-count-blue')).toHaveTextContent('10')
  })
})
