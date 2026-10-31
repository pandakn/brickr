import type { LegoColor } from '@/types'
import { describe, expect, test } from 'vitest'
import {
  COLOR_CODES,
  COLOR_CODE_MAX_LENGTH,
  findColorCodeIssues,
  getColorCode,
} from './colorCodes'
import { LEGO_PALETTE } from './legoColors'

function paletteColor(id: string): LegoColor {
  const color = LEGO_PALETTE.find((entry) => entry.id === id)
  if (!color) throw new Error(`Palette is missing "${id}"`)
  return color
}

describe('COLOR_CODES', () => {
  test('has no missing, malformed, duplicate or unknown codes', () => {
    expect(findColorCodeIssues(LEGO_PALETTE)).toEqual([])
  })

  test('assigns exactly one unique code per palette colour', () => {
    const codes = LEGO_PALETTE.map((color) => getColorCode(color))

    expect(codes).toHaveLength(LEGO_PALETTE.length)
    expect(new Set(codes).size).toBe(LEGO_PALETTE.length)
  })

  test('uses short uppercase codes that fit a guide cell', () => {
    for (const color of LEGO_PALETTE) {
      const code = getColorCode(color)
      expect(code, color.id).toMatch(/^[A-Z][A-Z0-9]*$/)
      expect(code, color.id).toBe(code.trim())
      expect(code.length, color.id).toBeLessThanOrEqual(COLOR_CODE_MAX_LENGTH)
    }
  })

  test('is deterministic for a given colour id', () => {
    for (const color of LEGO_PALETTE) {
      expect(getColorCode(color)).toBe(getColorCode({ id: color.id }))
      expect(getColorCode(color)).toBe(COLOR_CODES[color.id])
    }
  })

  test('distinguishes bright blue, bright pink and bright purple', () => {
    const codes = [
      getColorCode(paletteColor('bright-blue')),
      getColorCode(paletteColor('bright-pink')),
      getColorCode(paletteColor('bright-purple')),
    ]

    expect(new Set(codes).size).toBe(3)
  })
})

describe('findColorCodeIssues', () => {
  test('reports a palette colour with no code', () => {
    const incomplete = { ...COLOR_CODES }
    delete incomplete['medium-stone-grey']

    expect(findColorCodeIssues(LEGO_PALETTE, incomplete)).toEqual([
      { kind: 'missing', id: 'medium-stone-grey' },
    ])
  })

  test('reports two colours allocated the same code', () => {
    const colliding = {
      ...COLOR_CODES,
      'bright-pink': 'BP',
      'bright-purple': 'BP',
    }

    expect(findColorCodeIssues(LEGO_PALETTE, colliding)).toEqual([
      {
        kind: 'duplicate',
        code: 'BP',
        ids: ['bright-purple', 'bright-pink'],
      },
    ])
  })

  test('reports malformed codes', () => {
    const malformed = { ...COLOR_CODES, white: 'w' }

    expect(findColorCodeIssues(LEGO_PALETTE, malformed)).toEqual([
      { kind: 'malformed', id: 'white', code: 'w' },
    ])
  })

  test('reports a code left behind by a removed palette colour', () => {
    const stale = { ...COLOR_CODES, 'ultra-violet': 'UV' }

    expect(findColorCodeIssues(LEGO_PALETTE, stale)).toEqual([
      { kind: 'unknown', id: 'ultra-violet' },
    ])
  })
})

describe('getColorCode', () => {
  test('throws for an unregistered colour instead of guessing', () => {
    expect(() => getColorCode({ id: 'ultra-violet' })).toThrow(
      'No colour code registered for "ultra-violet"'
    )
  })
})
