import * as processor from '@/lib/imageProcessor'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useImageProcessor } from './useImageProcessor'

// Mock the image processor library
vi.mock('@/lib/imageProcessor', () => ({
  resizeImage: vi.fn(),
  buildPixelMatrix: vi.fn(),
  computePieceCounts: vi.fn(),
}))

describe('useImageProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should process image successfully', async () => {
    const mockImageData = {
      width: 1,
      height: 1,
      data: new Uint8ClampedArray(4),
    } as any
    const mockMatrix = [
      [{ name: 'Red', hex: '#FF0000', lab: [0, 0, 0] }],
    ] as any
    const mockCounts = [
      { color: mockMatrix[0][0], count: 1, percentage: 100 },
    ] as any

    vi.mocked(processor.resizeImage).mockResolvedValue(mockImageData)
    vi.mocked(processor.buildPixelMatrix).mockReturnValue(mockMatrix)
    vi.mocked(processor.computePieceCounts).mockReturnValue(mockCounts)

    const { result } = renderHook(() => useImageProcessor())

    const mockFile = new File([''], 'test.png', { type: 'image/png' })

    await act(async () => {
      await result.current.process(mockFile, 32, 0)
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.matrix).toEqual(mockMatrix)
    expect(result.current.pieceCounts).toEqual(mockCounts)
    expect(result.current.imageData).toEqual(mockImageData)
  })

  test('should handle errors during processing', async () => {
    vi.mocked(processor.resizeImage).mockRejectedValue(
      new Error('Resize failed')
    )

    const { result } = renderHook(() => useImageProcessor())

    const mockFile = new File([''], 'test.png', { type: 'image/png' })

    await act(async () => {
      await result.current.process(mockFile, 32, 0)
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBe('Resize failed')
    expect(result.current.matrix).toBeNull()
  })
})
