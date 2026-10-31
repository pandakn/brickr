import * as processor from '@/lib/imageProcessor'
import type { LegoColor } from '@/types'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useImageProcessor } from './useImageProcessor'

// Mock the image processor library
vi.mock('@/lib/imageProcessor', () => ({
  defaultConversionSettings: () => ({
    profile: 'photo',
    framing: { fit: 'contain', zoom: 1, positionX: 0.5, positionY: 0.5 },
  }),
  resizeImage: vi.fn(),
  buildPixelMatrix: vi.fn(),
  computePieceCounts: vi.fn(),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────

const red: LegoColor = {
  id: 'red',
  name: 'Bright Red',
  hex: '#E3000B',
  lab: [48, 63, 42],
}

const blue: LegoColor = {
  id: 'blue',
  name: 'Bright Blue',
  hex: '#006CB7',
  lab: [37, 16, -48],
}

function fakeImageData(width: number, height: number): ImageData {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
    colorSpace: 'srgb',
  } as ImageData
}

/** A promise whose resolution we control from the test body. */
type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const file = new File([''], 'test.png', { type: 'image/png' })

/**
 * Wire the mocked pipeline so each `ImageData` fixture maps to its own matrix
 * and piece counts.  `resizeImage` resolution is handled per-test.
 */
function useMatrixFixtures(entries: Array<[ImageData, LegoColor[][]]>): void {
  const matrices = new Map(entries)
  vi.mocked(processor.buildPixelMatrix).mockImplementation((imageData) => {
    return matrices.get(imageData) ?? []
  })
  vi.mocked(processor.computePieceCounts).mockImplementation((matrix) => {
    const cells = matrix
      .flat()
      .filter((cell): cell is LegoColor => cell !== null)
    const first = cells[0]
    return first ? [{ color: first, count: cells.length, percentage: 100 }] : []
  })
}

describe('useImageProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should process image successfully', async () => {
    const imageData = fakeImageData(1, 1)
    const matrix = [[red]]
    const counts = [{ color: red, count: 1, percentage: 100 }]

    vi.mocked(processor.resizeImage).mockResolvedValue(imageData)
    vi.mocked(processor.buildPixelMatrix).mockReturnValue(matrix)
    vi.mocked(processor.computePieceCounts).mockReturnValue(counts)

    const { result } = renderHook(() => useImageProcessor())

    await act(async () => {
      await result.current.process(file, 32, 32, 0)
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.matrix).toEqual(matrix)
    expect(result.current.pieceCounts).toEqual(counts)
    expect(result.current.imageData).toEqual(imageData)
  })

  test('should handle errors during processing', async () => {
    vi.mocked(processor.resizeImage).mockRejectedValue(
      new Error('Resize failed')
    )

    const { result } = renderHook(() => useImageProcessor())

    await act(async () => {
      await result.current.process(file, 32, 32, 0)
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBe('Resize failed')
    expect(result.current.matrix).toBeNull()
  })

  test('ignores a stale 32x32 success that resolves after a newer 64x64 success', async () => {
    const image32 = fakeImageData(32, 32)
    const image64 = fakeImageData(64, 64)
    useMatrixFixtures([
      [image32, Array.from({ length: 32 }, () => [red])],
      [image64, Array.from({ length: 64 }, () => [blue])],
    ])

    const pending32 = deferred<ImageData>()
    const pending64 = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockImplementation((_file, width) =>
      width === 64 ? pending64.promise : pending32.promise
    )

    const { result } = renderHook(() => useImageProcessor())

    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      // Distinct messiness values so we can prove the committed matrix was
      // produced with the settings of the request it belongs to.
      first = result.current.process(file, 32, 32, 10)
      second = result.current.process(file, 64, 64, 80)
    })

    // Newer request resolves first and wins
    await act(async () => {
      pending64.resolve(image64)
      await second
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.matrix).toEqual(
      Array.from({ length: 64 }, () => [blue])
    )
    expect(result.current.imageData).toBe(image64)
    expect(result.current.pieceCounts[0].color).toBe(blue)

    // The committed result was quantised with the newer request's settings
    expect(processor.buildPixelMatrix).toHaveBeenCalledWith(
      image64,
      80,
      expect.objectContaining({ profile: 'photo' })
    )
    expect(processor.buildPixelMatrix).toHaveBeenCalledTimes(1)

    // Stale request resolves late — nothing may change
    await act(async () => {
      pending32.resolve(image32)
      await first
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.matrix).toEqual(
      Array.from({ length: 64 }, () => [blue])
    )
    expect(result.current.imageData).toBe(image64)
    expect(result.current.pieceCounts[0].count).toBe(64)

    // The stale run never even reached the quantisation step
    expect(processor.buildPixelMatrix).toHaveBeenCalledTimes(1)
    expect(processor.buildPixelMatrix).not.toHaveBeenCalledWith(
      image32,
      10,
      expect.anything()
    )
  })

  test('ignores a stale failure that rejects after a newer success', async () => {
    const image32 = fakeImageData(32, 32)
    const image64 = fakeImageData(64, 64)
    useMatrixFixtures([
      [image32, [[red]]],
      [image64, [[blue]]],
    ])

    const pending32 = deferred<ImageData>()
    const pending64 = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockImplementation((_file, width) =>
      width === 64 ? pending64.promise : pending32.promise
    )

    const { result } = renderHook(() => useImageProcessor())

    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      first = result.current.process(file, 32, 32, 0)
      second = result.current.process(file, 64, 64, 0)
    })

    await act(async () => {
      pending64.resolve(image64)
      await second
    })

    await act(async () => {
      pending32.reject(new Error('Stale resize failed'))
      await first
    })

    expect(result.current.error).toBeNull()
    expect(result.current.matrix).toEqual([[blue]])
    expect(result.current.imageData).toBe(image64)
    expect(result.current.isProcessing).toBe(false)
  })

  test('keeps a newer error when a stale failure arrives afterwards', async () => {
    const pending32 = deferred<ImageData>()
    const pending64 = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockImplementation((_file, width) =>
      width === 64 ? pending64.promise : pending32.promise
    )

    const { result } = renderHook(() => useImageProcessor())

    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      first = result.current.process(file, 32, 32, 0)
      second = result.current.process(file, 64, 64, 0)
    })

    // The newer request fails first and owns the error status
    await act(async () => {
      pending64.reject(new Error('Newest resize failed'))
      await second
    })

    expect(result.current.error).toBe('Newest resize failed')
    expect(result.current.isProcessing).toBe(false)

    // The stale failure must not overwrite it
    await act(async () => {
      pending32.reject(new Error('Stale resize failed'))
      await first
    })

    expect(result.current.error).toBe('Newest resize failed')
    expect(result.current.isProcessing).toBe(false)
  })

  test('sets the error for a newer failure without committing a stale success', async () => {
    const image32 = fakeImageData(32, 32)
    const image64 = fakeImageData(64, 64)
    useMatrixFixtures([
      [image32, [[red]]],
      [image64, [[blue]]],
    ])

    const pending32 = deferred<ImageData>()
    const pending64 = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockImplementation((_file, width) =>
      width === 64 ? pending64.promise : pending32.promise
    )

    const { result } = renderHook(() => useImageProcessor())

    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      first = result.current.process(file, 32, 32, 0)
      second = result.current.process(file, 64, 64, 0)
    })

    // Stale request resolves first — superseded, so it must not commit
    await act(async () => {
      pending32.resolve(image32)
      await first
    })

    expect(result.current.matrix).toBeNull()
    expect(result.current.imageData).toBeNull()
    expect(result.current.isProcessing).toBe(true)

    // Newer request then fails — its error is the one the user sees
    await act(async () => {
      pending64.reject(new Error('Newest resize failed'))
      await second
    })

    expect(result.current.error).toBe('Newest resize failed')
    expect(result.current.matrix).toBeNull()
    expect(result.current.imageData).toBeNull()
    expect(result.current.isProcessing).toBe(false)
  })

  test('reset invalidates a pending request so a late resolution cannot repopulate state', async () => {
    const image32 = fakeImageData(32, 32)
    useMatrixFixtures([[image32, [[red]]]])

    const pending = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockReturnValue(pending.promise)

    const { result } = renderHook(() => useImageProcessor())

    let request!: Promise<void>
    act(() => {
      request = result.current.process(file, 32, 32, 0)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.isProcessing).toBe(false)

    await act(async () => {
      pending.resolve(image32)
      await request
    })

    expect(result.current.matrix).toBeNull()
    expect(result.current.imageData).toBeNull()
    expect(result.current.pieceCounts).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.isProcessing).toBe(false)
  })

  test('a stale finally does not clear the loading state of a newer request', async () => {
    const image32 = fakeImageData(32, 32)
    const image64 = fakeImageData(64, 64)
    useMatrixFixtures([
      [image32, [[red]]],
      [image64, [[blue]]],
    ])

    const pending32 = deferred<ImageData>()
    const pending64 = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockImplementation((_file, width) =>
      width === 64 ? pending64.promise : pending32.promise
    )

    const { result } = renderHook(() => useImageProcessor())

    let first!: Promise<void>
    let second!: Promise<void>
    act(() => {
      first = result.current.process(file, 32, 32, 0)
      second = result.current.process(file, 64, 64, 0)
    })

    // The stale run settles while the newer one is still pending
    await act(async () => {
      pending32.resolve(image32)
      await first
    })

    expect(result.current.isProcessing).toBe(true)
    expect(result.current.matrix).toBeNull()

    // …and the newer run still owns the loading flag when it finishes
    await act(async () => {
      pending64.resolve(image64)
      await second
    })

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.matrix).toEqual([[blue]])
    expect(result.current.imageData).toBe(image64)
  })

  test('unmount invalidates a pending request', async () => {
    const image32 = fakeImageData(32, 32)
    useMatrixFixtures([[image32, [[red]]]])

    const pending = deferred<ImageData>()
    vi.mocked(processor.resizeImage).mockReturnValue(pending.promise)

    const { result, unmount } = renderHook(() => useImageProcessor())

    let request!: Promise<void>
    act(() => {
      request = result.current.process(file, 32, 32, 0)
    })

    unmount()

    await act(async () => {
      pending.resolve(image32)
      await request
    })

    // Late state writes are ignored (no commit, no unhandled rejection)
    expect(processor.buildPixelMatrix).not.toHaveBeenCalled()
  })
})
