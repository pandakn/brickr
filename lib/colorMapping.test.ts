import { describe, it, expect } from 'vitest'
import { hexToLab, deltaE, nearestLegoColor } from './colorMapping'
import { LEGO_PALETTE } from './legoColors'

describe('colorMapping', () => {
  describe('hexToLab', () => {
    it('converts 6-digit hex to Lab', () => {
      const lab = hexToLab('#FF0000') // Red
      expect(lab[0]).toBeCloseTo(53.23, 1) // L*
      expect(lab[1]).toBeCloseTo(80.11, 1) // a*
      expect(lab[2]).toBeCloseTo(67.22, 1) // b*
    })

    it('converts 3-digit hex to Lab', () => {
      const lab = hexToLab('#F00') // Also Red
      const lab6 = hexToLab('#FF0000')
      expect(lab).toEqual(lab6)
    })
  })

  describe('deltaE', () => {
    it('calculates distance between identical colors as 0', () => {
      const lab: [number, number, number] = [50, 0, 0]
      expect(deltaE(lab, lab)).toBe(0)
    })

    it('calculates distance between different colors', () => {
      const lab1: [number, number, number] = [100, 0, 0] // White
      const lab2: [number, number, number] = [0, 0, 0]   // Black
      expect(deltaE(lab1, lab2)).toBe(100)
    })
  })

  describe('nearestLegoColor', () => {
    it('finds the nearest LEGO color for a red pixel', () => {
      // LEGO Red is #C91A09
      const result = nearestLegoColor(201, 26, 9)
      expect(result.name).toBe('Bright Red')
    })

    it('finds the nearest LEGO color for a black pixel', () => {
      const result = nearestLegoColor(10, 10, 10)
      expect(result.name).toBe('Black')
    })
  })
})
