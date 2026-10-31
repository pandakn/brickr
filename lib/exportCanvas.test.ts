import type { LegoColor } from '@/types'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { getColorCode } from './colorCodes'
import { exportBuildGuide } from './exportCanvas'
import { LEGO_PALETTE } from './legoColors'

type RecordedText = {
  text: string
  x: number
  y: number
  fillStyle: string
  font: string
}

function paletteColor(id: string): LegoColor {
  const color = LEGO_PALETTE.find((entry) => entry.id === id)
  if (!color) throw new Error(`Palette is missing "${id}"`)
  return color
}

/**
 * Minimal 2D context double: records text draws (the only output that matters
 * for guide assertions) and accepts the drawing calls exportBuildGuide makes.
 * jsdom has no real canvas implementation, so this replaces getContext.
 */
function createFakeContext() {
  const texts: RecordedText[] = []
  const fillText = vi.fn<(text: string, x: number, y: number) => void>()

  const ctx = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '10px monospace',
    textAlign: 'start' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    roundRect: vi.fn(),
    fillText,
    measureText: vi.fn((text: string) => ({ width: text.length * 6 })),
  }

  fillText.mockImplementation((text, x, y) => {
    texts.push({ text, x, y, fillStyle: ctx.fillStyle, font: ctx.font })
  })

  return { ctx, texts }
}

describe('exportBuildGuide', () => {
  const pink = paletteColor('bright-pink')
  const purple = paletteColor('bright-purple')
  const blue = paletteColor('bright-blue')
  const darkPink = paletteColor('dark-pink')

  let texts: RecordedText[]
  let renderedSize: { width: number; height: number }
  let downloadedAs: string | null

  beforeEach(() => {
    const fake = createFakeContext()
    texts = fake.texts
    renderedSize = { width: 0, height: 0 }
    downloadedAs = null

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fake.ctx as unknown as CanvasRenderingContext2D
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
      function (this: HTMLCanvasElement) {
        renderedSize = { width: this.width, height: this.height }
        return 'data:image/png;base64,'
      }
    )
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloadedAs = this.download
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function render(matrix: (LegoColor | null)[][]) {
    exportBuildGuide(matrix, { width: 12, height: 12 })
  }

  /** Codes drawn inside the guide grid, above the legend title. */
  function cellCodes(): string[] {
    const titleY = texts.find((entry) => entry.text === 'COLOUR LEGEND')!.y

    return texts
      .filter(
        (entry) => entry.font === 'bold 9px monospace' && entry.y < titleY
      )
      .map((entry) => entry.text)
  }

  /** Everything drawn below the legend title. */
  function legendTexts(): RecordedText[] {
    const titleY = texts.find((entry) => entry.text === 'COLOUR LEGEND')!.y

    return texts.filter((entry) => entry.y > titleY)
  }

  test('draws the canonical code in every non-empty cell', () => {
    render([[pink, purple]])

    expect(cellCodes()).toEqual([getColorCode(pink), getColorCode(purple)])
    expect(getColorCode(pink)).not.toBe(getColorCode(purple))
  })

  test('keeps bright blue, bright pink and bright purple distinguishable', () => {
    render([[blue, pink, purple]])

    const codes = cellCodes()
    expect(codes).toEqual([
      getColorCode(blue),
      getColorCode(pink),
      getColorCode(purple),
    ])
    expect(new Set(codes).size).toBe(3)
  })

  test('lists every colour used in the legend with its name', () => {
    render([[pink, purple]])

    const texts = legendTexts().map((entry) => entry.text)

    expect(texts).toEqual(
      expect.arrayContaining([
        'Bright Pink',
        'Bright Purple',
        getColorCode(pink),
        getColorCode(purple),
      ])
    )
    expect(texts).not.toContain('Bright Red')
  })

  test('legend entries sit below every cell so they never overlap the grid', () => {
    render([[pink, purple]])

    const titleY = texts.find((entry) => entry.text === 'COLOUR LEGEND')!.y
    const lowestCellText = Math.max(
      ...texts
        .filter(
          (entry) => entry.font === 'bold 9px monospace' && entry.y < titleY
        )
        .map((entry) => entry.y)
    )

    for (const entry of legendTexts()) {
      expect(entry.y).toBeGreaterThan(lowestCellText)
    }
  })

  test('grows the canvas height to fit the legend', () => {
    // Same name length, so the legend column width stays identical and only
    // the number of legend rows changes.
    render([[pink, pink]])
    const singleColour = { ...renderedSize }

    render([[pink, darkPink]])
    const twoColours = { ...renderedSize }

    expect(twoColours.width).toBe(singleColour.width)
    expect(twoColours.height).toBeGreaterThan(singleColour.height)
  })

  test('keeps the legend inside the canvas', () => {
    // A single-column grid is narrower than one legend entry, so the canvas
    // has to grow for the legend to fit.
    render([[pink]])

    const nameEntries = legendTexts().filter(
      (entry) => entry.font === '10px monospace'
    )
    expect(nameEntries.length).toBeGreaterThan(0)

    for (const entry of nameEntries) {
      const textWidth = entry.text.length * 6 // mock measureText width
      expect(entry.x + textWidth).toBeLessThanOrEqual(renderedSize.width)
    }
  })

  test('keeps the guide filename and handles edited matrices', () => {
    render([
      [pink, null],
      [null, purple],
    ])

    expect(downloadedAs).toBe('brickr-guide-12x12.png')
    expect(cellCodes()).toEqual([getColorCode(pink), getColorCode(purple)])
  })
})
