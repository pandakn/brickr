import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessinessSlider } from './MessinessSlider'
import React from 'react'

describe('MessinessSlider', () => {
  it('renders correctly with current value', () => {
    render(<MessinessSlider value={50} onChange={vi.fn()} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Messiness')).toBeInTheDocument()
  })

  it('renders axis labels', () => {
    render(<MessinessSlider value={50} onChange={vi.fn()} />)
    expect(screen.getByText('Clean')).toBeInTheDocument()
    expect(screen.getByText('Chaotic')).toBeInTheDocument()
  })
})
