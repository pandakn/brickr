import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { MessinessSlider } from './MessinessSlider'

describe('MessinessSlider', () => {
  test('renders correctly with current value', () => {
    render(<MessinessSlider value={50} onChange={vi.fn()} />)
    expect(screen.getByTestId('messiness-value')).toHaveTextContent('50%')
    expect(screen.getByText('Messiness')).toBeInTheDocument()
  })

  test('renders axis labels', () => {
    render(<MessinessSlider value={50} onChange={vi.fn()} />)
    expect(screen.getByText('Clean')).toBeInTheDocument()
    expect(screen.getByText('Chaotic')).toBeInTheDocument()
  })
})
