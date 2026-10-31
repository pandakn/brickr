import { useBrickCanvas } from '@/hooks/useBrickCanvas'
import { useImageProcessor } from '@/hooks/useImageProcessor'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSound } from '@/hooks/useSound'
import { exportAsImage, exportBuildGuide } from '@/lib/exportCanvas'
import { fetchImageAsFile } from '@/lib/imageLoader'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import Page from './page'

vi.mock(import('@/hooks/useBrickCanvas'))
vi.mock(import('@/hooks/useImageProcessor'))
vi.mock(import('@/hooks/useSound'))
vi.mock(import('@/hooks/useIsMobile'))
vi.mock(import('@/lib/imageLoader'))
vi.mock(import('@/lib/exportCanvas'))

vi.mock('vaul', () => {
  const Root = ({
    children,
    open,
  }: {
    children: React.ReactNode
    open?: boolean
  }) => (open !== false ? <>{children}</> : null)
  const Trigger = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )
  const Portal = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )
  const Overlay = () => null
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
  const Close = ({ children }: { children: React.ReactNode }) => <>{children}</>
  const Title = ({ children }: { children: React.ReactNode }) => <>{children}</>
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
  }
})

vi.mock('@tsparticles/react', () => ({
  default: () => <div data-testid="mock-particles" />,
  initParticlesEngine: vi.fn().mockResolvedValue(undefined),
}))

global.URL.createObjectURL = vi.fn((file) => `blob:${file.name}`)
global.URL.revokeObjectURL = vi.fn()

describe('Page component', () => {
  let mockCanvas: any
  let mockProcessor: any
  let mockSound: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockCanvas = {
      state: {
        pixelMatrix: [],
        gridDimensions: { width: 32, height: 32 },
        messiness: 0,
        renderMode: 'stud',
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
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  test('renders the initial state with DropZone', () => {
    render(<Page />)
    expect(screen.getByText('Brickr')).toBeInTheDocument()
    expect(screen.getByText(/Drop your image here/i)).toBeInTheDocument()
  })

  test('shows loading grid when processing', () => {
    mockProcessor.isProcessing = true
    render(<Page />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  test('shows error banner when processor has an error', () => {
    mockProcessor.error = 'Processing failed'
    render(<Page />)
    expect(screen.getByText('Processing failed')).toBeInTheDocument()
  })

  test('handles file upload via real DropZone', async () => {
    const { container } = render(<Page />)
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    expect(mockProcessor.process).toHaveBeenCalledWith(
      expect.any(File),
      32,
      32,
      0
    )
    expect(global.URL.createObjectURL).toHaveBeenCalled()
  })

  test('handles image loading via URL', async () => {
    const mockFile = new File([''], 'downloaded.png', { type: 'image/png' })
    vi.mocked(fetchImageAsFile).mockResolvedValue(mockFile)

    render(<Page />)
    const input = screen.getByPlaceholderText(/Paste an image URL here.../i)
    const loadButton = screen.getByRole('button', { name: /Load/i })

    fireEvent.change(input, {
      target: { value: 'https://example.com/image.png' },
    })

    await act(async () => {
      fireEvent.click(loadButton)
    })

    expect(fetchImageAsFile).toHaveBeenCalledWith(
      'https://example.com/image.png'
    )
    expect(mockProcessor.process).toHaveBeenCalledWith(mockFile, 32, 32, 0)
    expect(input).toHaveValue('')
  })

  test('syncs processor output to canvas state', () => {
    const { rerender } = render(<Page />)

    const mockMatrix = [[{ hex: '#FF0000', name: 'Red' }]]
    const mockImageData = { width: 1, height: 1 } as any

    mockProcessor.matrix = mockMatrix
    mockProcessor.imageData = mockImageData

    rerender(<Page />)

    expect(mockCanvas.loadImage).toHaveBeenCalledWith(mockMatrix, mockImageData)
  })

  test('updates settings and re-processes when image is loaded', async () => {
    const { container, rerender } = render(<Page />)

    const file = new File([''], 'test.png', { type: 'image/png' })
    const input = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    const size64Btn = screen.getAllByRole('button', { name: '64x64' })[0]
    fireEvent.click(size64Btn)

    expect(mockCanvas.setGridDimensions).toHaveBeenCalledWith({
      width: 64,
      height: 64,
    })
    expect(mockProcessor.process).toHaveBeenCalledWith(
      expect.any(File),
      64,
      64,
      0
    )

    mockCanvas.state.gridDimensions = { width: 64, height: 64 }
    rerender(<Page />)
  })

  test('handles keyboard shortcuts', () => {
    mockCanvas.state.pixelMatrix = [[{ hex: '#000000', name: 'Black' }]]
    render(<Page />)

    fireEvent.keyDown(window, { code: 'KeyG' })
    expect(mockCanvas.toggleGrid).toHaveBeenCalled()

    fireEvent.keyDown(window, { code: 'KeyB' })
    expect(mockCanvas.startBuild).toHaveBeenCalled()

    fireEvent.keyDown(window, { code: 'KeyR' })
    expect(mockCanvas.reset).toHaveBeenCalled()

    fireEvent.keyDown(window, { code: 'KeyE' })
    expect(exportAsImage).toHaveBeenCalled()

    fireEvent.keyDown(window, { code: 'KeyD' })
    expect(exportBuildGuide).toHaveBeenCalled()
  })

  test('does not export while a conversion is pending', () => {
    mockCanvas.state.pixelMatrix = [[{ hex: '#000000', name: 'Black' }]]
    mockProcessor.isProcessing = true
    const { rerender } = render(<Page />)

    fireEvent.keyDown(window, { code: 'KeyE' })
    fireEvent.keyDown(window, { code: 'KeyD' })

    expect(exportAsImage).not.toHaveBeenCalled()
    expect(exportBuildGuide).not.toHaveBeenCalled()

    // Once processing finishes, the shortcuts export again
    mockProcessor.isProcessing = false
    rerender(<Page />)

    fireEvent.keyDown(window, { code: 'KeyE' })
    fireEvent.keyDown(window, { code: 'KeyD' })

    expect(exportAsImage).toHaveBeenCalled()
    expect(exportBuildGuide).toHaveBeenCalled()
  })

  test('toggles comparison view via button and keyboard', async () => {
    const { container, rerender } = render(<Page />)

    const file = new File([''], 'test.png', { type: 'image/png' })
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    mockCanvas.state.pixelMatrix = [[{ hex: '#000000', name: 'Black' }]]
    rerender(<Page />)

    const compareBtn = await screen.findByRole('button', { name: /Compare/i })
    fireEvent.click(compareBtn)

    expect(screen.getByAltText(/Original/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Canvas/i })).toBeInTheDocument()

    fireEvent.keyDown(window, { code: 'KeyC' })
    expect(screen.queryByAltText(/Original/i)).not.toBeInTheDocument()
  })

  test('shows confetti when build is complete', async () => {
    vi.useFakeTimers()

    mockCanvas.state.pixelMatrix = [[{ hex: '#E3000B', name: 'Red' }]]
    mockCanvas.state.isBuilding = false
    mockCanvas.state.buildProgress = 1

    render(<Page />)

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    const confettiOverlay = document.querySelector(
      '.pointer-events-none.absolute.inset-0.z-30'
    )
    expect(confettiOverlay).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })

    expect(
      document.querySelector('.pointer-events-none.absolute.inset-0.z-30')
    ).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  test('handles global paste of image URL', async () => {
    const mockFile = new File([''], 'pasted.png', { type: 'image/png' })
    vi.mocked(fetchImageAsFile).mockResolvedValue(mockFile)

    render(<Page />)

    const pasteEvent = new Event('paste') as any
    pasteEvent.clipboardData = {
      getData: () => 'https://example.com/pasted.jpg',
    }

    await act(async () => {
      window.dispatchEvent(pasteEvent)
    })

    expect(fetchImageAsFile).toHaveBeenCalledWith(
      'https://example.com/pasted.jpg'
    )
    expect(mockProcessor.process).toHaveBeenCalledWith(mockFile, 32, 32, 0)
  })

  test('toggles mobile stats panel', async () => {
    mockCanvas.state.pixelMatrix = [[{ hex: '#000000', name: 'Black' }]]
    render(<Page />)

    const toggleBtn = screen.getByRole('button', { name: 'Stats' })
    fireEvent.click(toggleBtn)

    expect(screen.getByRole('button', { name: 'Stats' })).toBeInTheDocument()
  })

  test('handleCellClick plays sound and updates canvas', () => {
    mockCanvas.state.pixelMatrix = [[{ hex: '#000000', name: 'Black' }]]
    render(<Page />)

    const cell = screen.getByRole('button', { name: 'Black' })
    fireEvent.click(cell)

    expect(mockSound.playClick).toHaveBeenCalled()
    expect(mockCanvas.handleCellClick).toHaveBeenCalledWith(0, 0)
  })

  test('reset button removes all data and returns to upload state', async () => {
    mockCanvas.state.pixelMatrix = [[{ hex: '#000000', name: 'Black' }]]
    const { rerender } = render(<Page />)

    expect(screen.getAllByText(/Grid size/i)[0]).toBeInTheDocument()
    expect(screen.getAllByText(/Colour breakdown/i)[0]).toBeInTheDocument()

    // 2. Click Reset
    const resetBtn = screen.getAllByRole('button', { name: /Reset/i })[0]
    fireEvent.click(resetBtn)

    expect(mockCanvas.reset).toHaveBeenCalled()

    mockCanvas.state.pixelMatrix = []
    rerender(<Page />)

    expect(screen.getByTestId('drop-zone')).toBeInTheDocument()
    expect(screen.getAllByTestId('control-panel')[0]).toBeInTheDocument()
    expect(screen.getAllByTestId('stats-panel')[0]).toBeInTheDocument()

    // stats panel
    expect(screen.getAllByTestId('total-pieces')[0]).toHaveTextContent('—')
    expect(screen.queryByTestId('build-time')).not.toBeInTheDocument()
    expect(screen.queryByTestId('fun-message')).not.toBeInTheDocument()
    expect(screen.queryByTestId('build-status')).not.toBeInTheDocument()
    expect(screen.queryByTestId('build-progress-bar')).not.toBeInTheDocument()
    expect(
      screen.getByTestId('color-breakdown-empty-state')
    ).toBeInTheDocument()
  })
})
