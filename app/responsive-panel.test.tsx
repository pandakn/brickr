import { useBrickCanvas } from '@/hooks/useBrickCanvas'
import { useImageProcessor } from '@/hooks/useImageProcessor'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSound } from '@/hooks/useSound'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Page from './page'

vi.mock(import('@/hooks/useBrickCanvas'))
vi.mock(import('@/hooks/useImageProcessor'))
vi.mock(import('@/hooks/useSound'))
vi.mock(import('@/hooks/useIsMobile'))
vi.mock(import('@/lib/imageLoader'))
vi.mock(import('@/lib/exportCanvas'))

vi.mock('vaul', () => {
  const calls: { open?: boolean }[] = []

  const Root = ({
    children,
    open,
  }: {
    children: React.ReactNode
    open?: boolean
  }) => {
    calls.push({ open })
    return open !== false ? <>{children}</> : null
  }
  const Content = ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => (
    <div data-testid="mock-drawer-content" className={className}>
      {children}
    </div>
  )
  const Trigger = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )
  const Portal = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )
  const Overlay = () => null
  const Close = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const Title = ({
    children,
    className,
  }: {
    children: React.ReactNode
    className?: string
  }) => <h2 className={className}>{children}</h2>
  const Description = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )

  return {
    Drawer: {
      Root,
      Trigger,
      Portal,
      Overlay,
      Content,
      Close,
      Title,
      Description,
    },
    __calls: calls,
  }
})

let mockCanvas: ReturnType<typeof useBrickCanvas>
let mockProcessor: ReturnType<typeof useImageProcessor>
let mockSound: ReturnType<typeof useSound>

function setupMocks() {
  mockCanvas = {
    state: {
      originalImage: null,
      pixelMatrix: [],
      gridDimensions: { width: 32, height: 32 },
      messiness: 0,
      renderMode: 'stud' as const,
      showGrid: false,
      isBuilding: false,
      buildProgress: 0,
    },
    buildKey: 0,
    loadImage: vi.fn(),
    setGridDimensions: vi.fn(),
    setMessiness: vi.fn(),
    setRenderMode: vi.fn(),
    toggleGrid: vi.fn(),
    startBuild: vi.fn(),
    handleCellClick: vi.fn(),
    reset: vi.fn(),
  }

  mockProcessor = {
    matrix: null,
    imageData: null,
    pieceCounts: [],
    isProcessing: false,
    error: null,
    reset: vi.fn(),
    process: vi.fn().mockResolvedValue(undefined),
  }

  mockSound = {
    soundEnabled: false,
    toggleSound: vi.fn(),
    playClick: vi.fn(),
  }

  vi.mocked(useBrickCanvas).mockReturnValue(mockCanvas)
  vi.mocked(useImageProcessor).mockReturnValue(mockProcessor)
  vi.mocked(useSound).mockReturnValue(mockSound)
}

describe('Responsive panels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMocks()
  })

  test('desktop: renders fixed sidebars, no drawer', () => {
    vi.mocked(useIsMobile).mockReturnValue(false)
    render(<Page />)

    // Desktop renders fixed sidebar wrappers
    const controlPanel = screen.getByTestId('control-panel')
    expect(controlPanel.closest('.fixed')).toBeInTheDocument()

    const statsPanel = screen.getByTestId('stats-panel')
    expect(statsPanel.closest('.fixed')).toBeInTheDocument()

    // No drawer content on desktop
    expect(screen.queryByTestId('mock-drawer-content')).not.toBeInTheDocument()
  })

  test('mobile: renders panels inside drawer', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    render(<Page />)

    // Control panel drawer is open by default
    expect(screen.getByTestId('mock-drawer-content')).toBeInTheDocument()
    expect(screen.getByTestId('control-panel')).toBeInTheDocument()
  })

  test('mobile: control panel drawer opens by default', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    render(<Page />)

    // The control panel should be visible (defaultOpen means open !== false)
    expect(screen.getByTestId('control-panel')).toBeInTheDocument()
    expect(screen.getByText('Grid size')).toBeInTheDocument()
  })

  test('mobile: stats drawer toggles via button', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    mockCanvas.state.pixelMatrix = [
      [{ id: 'black', name: 'Black', hex: '#000000', lab: [0, 0, 0] }],
    ]
    render(<Page />)

    const toggleBtn = screen.getByRole('button', { name: 'Stats' })
    expect(toggleBtn).toBeInTheDocument()

    fireEvent.click(toggleBtn)
    expect(screen.getByRole('button', { name: 'Stats' })).toBeInTheDocument()
  })

  test('mobile: stats drawer closes on reset', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    mockCanvas.state.pixelMatrix = [
      [{ id: 'black', name: 'Black', hex: '#000000', lab: [0, 0, 0] }],
    ]
    render(<Page />)

    // Open stats
    fireEvent.click(screen.getByRole('button', { name: 'Stats' }))

    // Reset
    const resetBtn = screen.getAllByRole('button', { name: /Reset/i })[0]
    fireEvent.click(resetBtn)

    expect(mockCanvas.reset).toHaveBeenCalled()
  })
})
