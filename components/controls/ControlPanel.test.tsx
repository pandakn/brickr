import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { ControlPanel } from './ControlPanel'

describe('ControlPanel', () => {
  const defaultProps = {
    gridDimensions: { width: 32 as const, height: 32 as const },
    messiness: 0,
    renderMode: 'stud' as const,
    showGrid: false,
    isBuilding: false,
    soundEnabled: true,
    hasImage: true,
    onGridDimensionsChange: vi.fn(),
    onMessinessChange: vi.fn(),
    onRenderModeChange: vi.fn(),
    onGridToggle: vi.fn(),
    onSoundToggle: vi.fn(),
    onBuild: vi.fn(),
    onReset: vi.fn(),
  }

  test('renders correctly with estimates', () => {
    render(<ControlPanel {...defaultProps} />)
    // 32 * 32 = 1024
    expect(screen.getByTestId('pieces-estimate')).toHaveTextContent(/1,024 pieces/i)
    expect(screen.getByTestId('minutes-estimate')).toHaveTextContent(/~256 min/i)
  })

  test('toggles render mode', () => {
    render(<ControlPanel {...defaultProps} />)
    const flatBtn = screen.getByTestId('render-mode-flat')
    fireEvent.click(flatBtn)
    expect(defaultProps.onRenderModeChange).toHaveBeenCalledWith('flat')
  })

  test('handles build button clicks', () => {
    render(<ControlPanel {...defaultProps} />)
    const buildBtn = screen.getByTestId('build-button')
    fireEvent.click(buildBtn)
    expect(defaultProps.onBuild).toHaveBeenCalled()
  })

  test('disables build button when no image', () => {
    render(<ControlPanel {...defaultProps} hasImage={false} />)
    const buildBtn = screen.getByTestId('build-button')
    expect(buildBtn).toBeDisabled()
  })

  test('shows building status', () => {
    render(<ControlPanel {...defaultProps} isBuilding={true} />)
    expect(screen.getByTestId('build-button')).toHaveTextContent('Building…')
  })
})
