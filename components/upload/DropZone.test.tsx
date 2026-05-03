import { act, render, screen } from '@testing-library/react'
import { useDropzone } from 'react-dropzone'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { DropZone } from './DropZone'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(),
}))

// Mock BackgroundBeams
vi.mock('@/components/ui/background-beams', () => ({
  BackgroundBeams: () => <div data-testid="background-beams" />,
}))

describe('DropZone', () => {
  const mockOnFile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders initial state correctly', () => {
    vi.mocked(useDropzone).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    } as any)

    render(<DropZone onFile={mockOnFile} />)
    expect(screen.getByTestId('drop-zone')).toBeInTheDocument()
    expect(screen.getByTestId('drop-zone-heading')).toHaveTextContent(
      'Drop your image here'
    )
  })

  test('shows "Drop it!" when drag is active', () => {
    vi.mocked(useDropzone).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: true,
    } as any)

    render(<DropZone onFile={mockOnFile} />)
    expect(screen.getByTestId('drop-zone-heading')).toHaveTextContent(
      'Drop it!'
    )
  })

  test('displays error message for too large files', async () => {
    let onDropHandler: any
    vi.mocked(useDropzone).mockImplementation(({ onDrop }: any) => {
      onDropHandler = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      } as any
    })

    render(<DropZone onFile={mockOnFile} />)

    await act(async () => {
      onDropHandler(
        [],
        [
          {
            file: {} as File,
            errors: [{ code: 'file-too-large', message: '' }],
          },
        ]
      )
    })

    expect(screen.getByTestId('drop-zone-error')).toHaveTextContent(
      /That file is too large/i
    )
  })

  test('displays error message for invalid file types', async () => {
    let onDropHandler: any
    vi.mocked(useDropzone).mockImplementation(({ onDrop }: any) => {
      onDropHandler = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      } as any
    })

    render(<DropZone onFile={mockOnFile} />)

    await act(async () => {
      onDropHandler(
        [],
        [
          {
            file: {} as File,
            errors: [{ code: 'file-invalid-type', message: '' }],
          },
        ]
      )
    })

    expect(screen.getByTestId('drop-zone-error')).toHaveTextContent(
      /Only JPG, PNG, and WebP images are supported/i
    )
  })

  test('calls onFile when a valid file is dropped', async () => {
    let onDropHandler: any
    vi.mocked(useDropzone).mockImplementation(({ onDrop }: any) => {
      onDropHandler = onDrop
      return {
        getRootProps: () => ({}),
        getInputProps: () => ({}),
        isDragActive: false,
      } as any
    })

    render(<DropZone onFile={mockOnFile} />)

    const mockFile = new File([''], 'test.png', { type: 'image/png' })
    await act(async () => {
      onDropHandler([mockFile], [])
    })

    expect(mockOnFile).toHaveBeenCalledWith(mockFile)
  })

  test('does not show error in initial state', () => {
    vi.mocked(useDropzone).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    } as any)

    render(<DropZone onFile={mockOnFile} />)
    expect(screen.queryByTestId('drop-zone-error')).not.toBeInTheDocument()
  })
})
