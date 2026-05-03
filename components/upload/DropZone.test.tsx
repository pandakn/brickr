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
    expect(screen.getByText(/Drop your image here/i)).toBeInTheDocument()
  })

  test('shows "Drop it!" when drag is active', () => {
    vi.mocked(useDropzone).mockReturnValue({
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: true,
    } as any)

    render(<DropZone onFile={mockOnFile} />)
    expect(screen.getByText(/Drop it!/i)).toBeInTheDocument()
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

    expect(screen.getByText(/That file is too large/i)).toBeInTheDocument()
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

    expect(
      screen.getByText(/Only JPG, PNG, and WebP images are supported/i)
    ).toBeInTheDocument()
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
})
