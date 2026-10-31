import type { LegoColor } from '@/types'
import { describe, expect, test } from 'vitest'
import {
  applyMessiness,
  buildPixelMatrix,
  calculateImagePlacement,
  computePieceCounts,
  defaultConversionSettings,
} from './imageProcessor'
import { LEGO_PALETTE } from './legoColors'

describe('imageProcessor', () => {
  const red = LEGO_PALETTE.find((c) => c.name === 'Bright Red')!
  const blue = LEGO_PALETTE.find((c) => c.name === 'Bright Blue')!

  describe('calculateImagePlacement', () => {
    test('contains a portrait image without stretching it', () => {
      const settings = defaultConversionSettings().framing
      const placement = calculateImagePlacement({
        sourceWidth: 20,
        sourceHeight: 40,
        targetWidth: 32,
        targetHeight: 32,
        settings,
      })

      expect(placement).toEqual({ left: 8, top: 0, width: 16, height: 32 })
    })

    test('covers a portrait image and adjusts crop position', () => {
      const placement = calculateImagePlacement({
        sourceWidth: 20,
        sourceHeight: 40,
        targetWidth: 32,
        targetHeight: 32,
        settings: {
          fit: 'cover',
          zoom: 1,
          positionX: 0.5,
          positionY: 1,
        },
      })

      expect(placement).toEqual({ left: 0, top: -32, width: 32, height: 64 })
    })

    test('zooms while preserving the source aspect ratio', () => {
      const placement = calculateImagePlacement({
        sourceWidth: 40,
        sourceHeight: 20,
        targetWidth: 32,
        targetHeight: 32,
        settings: {
          fit: 'contain',
          zoom: 2,
          positionX: 0.5,
          positionY: 0.5,
        },
      })

      expect(placement.width / placement.height).toBe(2)
      expect(placement.left).toBe(-16)
      expect(placement.top).toBe(0)
    })
  })

  describe('computePieceCounts', () => {
    test('returns empty array for empty matrix', () => {
      expect(computePieceCounts([])).toEqual([])
    })

    test('counts occurrences of each color', () => {
      const matrix: (LegoColor | null)[][] = [
        [red, blue],
        [red, null],
      ]
      const counts = computePieceCounts(matrix)

      expect(counts).toHaveLength(2)
      expect(counts[0].color.name).toBe('Bright Red')
      expect(counts[0].count).toBe(2)
      expect(counts[0].percentage).toBeCloseTo(66.66, 1) // 2 out of 3 non-null

      expect(counts[1].color.name).toBe('Bright Blue')
      expect(counts[1].count).toBe(1)
      expect(counts[1].percentage).toBeCloseTo(33.33, 1)
    })

    test('sorts by count descending', () => {
      const matrix = [[blue, red, blue]]
      const counts = computePieceCounts(matrix)
      expect(counts[0].color.name).toBe('Bright Blue')
    })

    test('excludes empty cells from totals and percentages', () => {
      const matrix: (LegoColor | null)[][] = [
        [red, null, null],
        [null, blue, null],
        [null, null, null],
      ]
      const counts = computePieceCounts(matrix)

      expect(counts).toHaveLength(2)
      expect(counts.reduce((sum, count) => sum + count.count, 0)).toBe(2)
      expect(counts.map((count) => count.percentage)).toEqual([50, 50])
    })

    test('returns no counts for a fully empty pattern', () => {
      expect(
        computePieceCounts([
          [null, null],
          [null, null],
        ])
      ).toEqual([])
    })
  })

  describe('applyMessiness', () => {
    test('returns original matrix when messiness is 0', () => {
      const matrix = [[red]]
      expect(applyMessiness(matrix, 0)).toBe(matrix)
    })

    test('returns a different matrix when messiness is 100', () => {
      // Use a larger matrix to increase probability of a swap
      const matrix = Array(10).fill(Array(10).fill(red))
      const messy = applyMessiness(matrix, 100)

      expect(messy).not.toEqual(matrix)
    })

    test('is reproducible with the same matrix and messiness', () => {
      const matrix = [
        [red, blue],
        [blue, red],
      ]
      const messy1 = applyMessiness(matrix, 50)
      const messy2 = applyMessiness(matrix, 50)

      expect(messy1).toEqual(messy2)
    })
  })

  describe('buildPixelMatrix', () => {
    test('maps ImageData to LegoColor matrix', () => {
      // 1x2 image: Red (255,0,0) and Blue (0,0,255)
      const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255])
      const imageData = new ImageData(data, 2, 1)

      const matrix = buildPixelMatrix(imageData, 0)

      expect(matrix).toHaveLength(1)
      expect(matrix[0]).toHaveLength(2)
      expect(matrix[0][0].name).toBe('Bright Red')
      expect(matrix[0][1].name).toBe('Bright Blue')
    })

    test('composites transparent pixels against white', () => {
      // Fully transparent pixel
      const data = new Uint8ClampedArray([0, 0, 0, 0])
      const imageData = new ImageData(data, 1, 1)

      const matrix = buildPixelMatrix(imageData, 0)

      // Should map to White because it's composited against white
      expect(matrix[0][0].name).toBe('White')
    })

    test('avatar profile limits colours deterministically without mutating input pixels', () => {
      const data = new Uint8ClampedArray([
        255, 0, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255, 0, 255, 0, 255,
      ])
      const imageData = new ImageData(data, 4, 1)
      const settings = {
        profile: 'avatar' as const,
        maxColors: 2,
        framing: defaultConversionSettings().framing,
      }

      const first = buildPixelMatrix(imageData, 0, settings)
      const second = buildPixelMatrix(imageData, 0, settings)

      expect(first).toEqual(second)
      expect(
        new Set(first[0].map((color) => color.id)).size
      ).toBeLessThanOrEqual(2)
      expect([...imageData.data]).toEqual([...data])
    })
  })
})
