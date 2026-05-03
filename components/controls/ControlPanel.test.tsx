import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ControlPanel } from './ControlPanel'
import React from 'react'

describe('ControlPanel', () => {
  const defaultProps = {
    gridSize: 32 as const,
    messiness: 0,
    renderMode: 'stud' as const,
    showGrid: false,
    isBuilding: false,
    soundEnabled: true,
    hasImage: true,
    onGridSizeChange: vi.fn(),
    onMessinessChange: vi.fn(),
    onRenderModeChange: vi.fn(),
    onGridToggle: vi.fn(),
    onSoundToggle: vi.fn(),
    onBuild: vi.fn(),
    onReset: vi.fn(),
  }

  it('renders correctly with estimates', () => {
    render(<ControlPanel {...defaultProps} />)
    // 32 * 32 = 1024
    expect(screen.getByText(/1,024 pieces/i)).toBeInTheDocument()
    // (1024 * 15) / 60 = 256 minutes? 
    // Wait: 1024 * 15 = 15360. 15360 / 60 = 256.
    expect(screen.getByText(/~256 min/i)).toBeInTheDocument()
  })

  it('toggles render mode', () => {
    render(<ControlPanel {...defaultProps} />)
    const flatBtn = screen.getByRole('button', { name: /Flat/i })
    fireEvent.click(flatBtn)
    expect(defaultProps.onRenderModeChange).toHaveBeenCalledWith('flat')
  })

  it('handles build button clicks', () => {
    render(<ControlPanel {...defaultProps} />)
    const buildBtn = screen.getByRole('button', { name: /Build it/i })
    fireEvent.click(buildBtn)
    expect(defaultProps.onBuild).toHaveBeenCalled()
  })

  it('disables build button when no image', () => {
    render(<ControlPanel {...defaultProps} hasImage={false} />)
    const buildBtn = screen.getByRole('button', { name: /Build it/i })
    expect(buildBtn).toBeDisabled()
  })

  it('shows building status', () => {
    render(<ControlPanel {...defaultProps} isBuilding={true} />)
    expect(screen.getByText('Building…')).toBeInTheDocument()
  })
})
