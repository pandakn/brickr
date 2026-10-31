import type { LegoColor } from '@/types'
import { computePieceCounts } from '@/lib/imageProcessor'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useBrickCanvas } from './useBrickCanvas'

describe('useBrickCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useBrickCanvas())

    expect(result.current.state.gridDimensions).toEqual({
      width: 32,
      height: 32,
    })
    expect(result.current.state.messiness).toBe(0)
    expect(result.current.state.pixelMatrix).toEqual([])
    expect(result.current.state.isBuilding).toBe(false)
  })

  test('should update grid dimensions', () => {
    const { result } = renderHook(() => useBrickCanvas())

    act(() => {
      result.current.setGridDimensions({ width: 64, height: 40 })
    })

    expect(result.current.state.gridDimensions).toEqual({
      width: 64,
      height: 40,
    })
  })

  test('should update messiness within bounds', () => {
    const { result } = renderHook(() => useBrickCanvas())

    act(() => {
      result.current.setMessiness(50)
    })
    expect(result.current.state.messiness).toBe(50)

    act(() => {
      result.current.setMessiness(150)
    })
    expect(result.current.state.messiness).toBe(100)

    act(() => {
      result.current.setMessiness(-10)
    })
    expect(result.current.state.messiness).toBe(0)
  })

  test('should toggle grid', () => {
    const { result } = renderHook(() => useBrickCanvas())

    expect(result.current.state.showGrid).toBe(false)

    act(() => {
      result.current.toggleGrid()
    })

    expect(result.current.state.showGrid).toBe(true)
  })

  test('should handle cell click to remove and restore', () => {
    const { result } = renderHook(() => useBrickCanvas())

    const mockColor: LegoColor = {
      id: '1',
      name: 'Red',
      hex: '#FF0000',
      lab: [0, 0, 0],
    }
    const mockMatrix = [[mockColor]]
    const mockImageData = new ImageData(new Uint8ClampedArray(4), 1, 1)

    act(() => {
      result.current.loadImage(mockMatrix, mockImageData)
    })

    expect(result.current.state.pixelMatrix[0][0]).toEqual(mockColor)

    // Click to remove
    act(() => {
      result.current.handleCellClick(0, 0)
    })
    expect(result.current.state.pixelMatrix[0][0]).toBeNull()

    // Click to restore
    act(() => {
      result.current.handleCellClick(0, 0)
    })
    expect(result.current.state.pixelMatrix[0][0]).toEqual(mockColor)
  })

  test('should update derived piece counts as cells are removed and restored', () => {
    const { result } = renderHook(() => useBrickCanvas())

    const red: LegoColor = {
      id: 'red',
      name: 'Red',
      hex: '#FF0000',
      lab: [0, 0, 0],
    }
    const blue: LegoColor = {
      id: 'blue',
      name: 'Blue',
      hex: '#0000FF',
      lab: [0, 0, 0],
    }
    const matrix = [
      [red, red],
      [red, blue],
    ]

    act(() => {
      result.current.loadImage(
        matrix,
        new ImageData(new Uint8ClampedArray(16), 2, 2)
      )
    })

    const total = () =>
      computePieceCounts(result.current.state.pixelMatrix).reduce(
        (sum, count) => sum + count.count,
        0
      )

    expect(total()).toBe(4)

    // Removing one red brick drops the total and that colour's count
    act(() => {
      result.current.handleCellClick(0, 0)
    })
    expect(total()).toBe(3)
    expect(result.current.state.pixelMatrix[1][1]).toBe(blue)

    // Restoring it brings the counts back, sourced from the original matrix
    act(() => {
      result.current.handleCellClick(0, 0)
    })
    expect(total()).toBe(4)
    expect(
      computePieceCounts(result.current.state.pixelMatrix).find(
        (count) => count.color.id === 'red'
      )?.count
    ).toBe(3)
  })

  test('should reset state', () => {
    const { result } = renderHook(() => useBrickCanvas())

    act(() => {
      result.current.setGridDimensions({ width: 64, height: 64 })
      result.current.setMessiness(50)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.gridDimensions).toEqual({
      width: 32,
      height: 32,
    })
    expect(result.current.state.messiness).toBe(0)
  })
})
