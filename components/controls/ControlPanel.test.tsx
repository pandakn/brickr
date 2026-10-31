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
    totalPieces: 640,
    onGridDimensionsChange: vi.fn(),
    onMessinessChange: vi.fn(),
    onRenderModeChange: vi.fn(),
    onGridToggle: vi.fn(),
    onSoundToggle: vi.fn(),
    onBuild: vi.fn(),
    onReset: vi.fn(),
  }

  test('shows the grid capacity estimate before an image exists', () => {
    render(<ControlPanel {...defaultProps} hasImage={false} totalPieces={0} />)
    // 32 * 32 = 1024 — capacity, not actual pieces
    expect(screen.getByTestId('pieces-estimate')).toHaveTextContent(
      '~1,024 pieces'
    )
    // 1024 * 15s / 60s = 256 minutes
    expect(screen.getByTestId('minutes-estimate')).toHaveTextContent('~256 min')
  })

  test('shows the actual required pieces after generation', () => {
    render(<ControlPanel {...defaultProps} hasImage={true} totalPieces={640} />)
    // 640 physical bricks, not the 1024-cell grid capacity
    expect(screen.getByTestId('pieces-estimate')).toHaveTextContent(
      '640 pieces'
    )
    expect(screen.getByTestId('pieces-estimate')).not.toHaveTextContent('~')
    // 640 * 15s / 60s = 160 minutes
    expect(screen.getByTestId('minutes-estimate')).toHaveTextContent(
      '≈ 160 min'
    )
  })

  test('actual pieces exclude empty cells from the count and build time', () => {
    // 1024-cell grid with 24 cells removed → 1000 physical bricks
    render(
      <ControlPanel {...defaultProps} hasImage={true} totalPieces={1000} />
    )
    expect(screen.getByTestId('pieces-estimate')).toHaveTextContent(
      '1,000 pieces'
    )
    // 1000 * 15s / 60s = 250 minutes
    expect(screen.getByTestId('minutes-estimate')).toHaveTextContent(
      '≈ 250 min'
    )
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
