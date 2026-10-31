/**
 * Brickr — canvas export utilities
 *
 * Both functions draw onto an offscreen HTMLCanvasElement and trigger a PNG
 * download via a transient <a> element.  All work is synchronous and runs
 * entirely in the browser — no server round-trip, no file-system access.
 *
 * Public API
 * ──────────
 *  exportAsImage(matrix, renderMode, cellSize)
 *    → brickr-export.png  (pixel-art render at cellSize px per stud)
 *
 *  exportBuildGuide(matrix, gridSize)
 *    → brickr-guide-<w>x<h>.png
 *      (labeled instruction grid with Excel coordinates and a code legend)
 */

import type { GridDimensions, LegoColor, RenderMode } from '@/types'
import { getColorCode } from './colorCodes'

// ─── Guide layout constants ────────────────────────────────────────────────

const GUIDE_CELL = 28 // px — data cell size
const GUIDE_HDR_W = 28 // px — row-number column width
const GUIDE_HDR_H = 24 // px — column-label row height
const GUIDE_GAP = 1 // px — gap between cells (doubles as grid line)
const GUIDE_FONT = 9 // px — code text inside cells
const GUIDE_HDR_FONT = 8 // px — header label text

// ─── Legend layout constants ───────────────────────────────────────────────

const LEGEND_GAP = 18 // px — space between the grid and the legend title
const LEGEND_PAD = 12 // px — left/right/bottom margin around legend content
const LEGEND_TITLE_H = 18 // px — legend title row height
const LEGEND_ROW_H = 26 // px — legend entry row height
const LEGEND_SWATCH = 22 // px — swatch square size (holds the code)
const LEGEND_TEXT_GAP = 8 // px — gap between swatch and colour name
const LEGEND_COL_GAP = 16 // px — gap between legend columns
const LEGEND_CODE_FONT = 9 // px — code inside the swatch
const LEGEND_NAME_FONT = 10 // px — colour name text
const LEGEND_TITLE_FONT = 10 // px — legend title text

// ─── Private helpers ──────────────────────────────────────────────────────

/**
 * Excel-style column label (0-indexed).
 *   0 → "A", 25 → "Z", 26 → "AA", 27 → "AB", …, 63 → "BL"
 */
function colLabel(idx: number): string {
  if (idx < 26) return String.fromCharCode(65 + idx)
  const high = Math.floor(idx / 26) - 1
  const low = idx % 26
  return String.fromCharCode(65 + high) + String.fromCharCode(65 + low)
}

/**
 * Perceived luminance of a hex colour (0–1, Rec. 709 weighting).
 * Used to choose dark vs. light label text for contrast.
 */
function hexLuma(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Label colour with enough contrast against `hex`. */
function labelColor(hex: string): string {
  return hexLuma(hex) <= 0.35 ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.75)'
}

// ─── Legend helpers ───────────────────────────────────────────────────────

type LegendEntry = {
  color: LegoColor
  code: string
}

/**
 * Unique colours in first-appearance (row-major) order.
 * Order is stable for a given matrix and independent of palette order.
 */
function collectLegendEntries(matrix: (LegoColor | null)[][]): LegendEntry[] {
  const seen = new Set<string>()
  const entries: LegendEntry[] = []

  for (const row of matrix) {
    for (const color of row) {
      if (!color || seen.has(color.id)) continue
      seen.add(color.id)
      entries.push({ color, code: getColorCode(color) })
    }
  }

  return entries
}

/**
 * Measure the widest legend entry so the legend never overflows the canvas.
 *
 * Every entry is laid out on the same width (the widest one), which keeps the
 * columns aligned. The code is drawn inside the swatch, so only the colour
 * name contributes to the text width.
 */
function measureLegendEntryWidth(
  ctx: CanvasRenderingContext2D,
  entries: LegendEntry[]
): number {
  if (entries.length === 0) return 0

  ctx.font = `${LEGEND_NAME_FONT}px monospace`
  const textWidth = Math.max(
    ...entries.map((entry) => ctx.measureText(entry.color.name).width)
  )

  return LEGEND_SWATCH + LEGEND_TEXT_GAP + textWidth
}

/**
 * Column count and total height needed to lay the legend out in `width`.
 */
function legendLayout(
  entries: LegendEntry[],
  entryWidth: number,
  width: number
): { cols: number; rows: number; width: number; height: number } {
  if (entries.length === 0) {
    return { cols: 0, rows: 0, width: 0, height: 0 }
  }

  const available = width - LEGEND_PAD * 2
  const cols = Math.max(
    1,
    Math.floor((available + LEGEND_COL_GAP) / (entryWidth + LEGEND_COL_GAP))
  )
  const rows = Math.ceil(entries.length / cols)
  const legendWidth =
    LEGEND_PAD * 2 + cols * entryWidth + (cols - 1) * LEGEND_COL_GAP
  const height = LEGEND_GAP + LEGEND_TITLE_H + rows * LEGEND_ROW_H + LEGEND_PAD

  return { cols, rows, width: legendWidth, height }
}

/**
 * Draw the colour legend below the guide grid: one entry per colour used,
 * each with a swatch (showing the same canonical code as the cell), the code
 * and the readable colour name.
 */
function drawLegend(
  ctx: CanvasRenderingContext2D,
  entries: LegendEntry[],
  entryWidth: number,
  cols: number,
  top: number
): void {
  if (entries.length === 0) return

  const titleY = top + LEGEND_GAP + LEGEND_TITLE_H / 2
  const entriesTop = top + LEGEND_GAP + LEGEND_TITLE_H

  ctx.fillStyle = '#1A1A1A' // brick-black
  ctx.font = `bold ${LEGEND_TITLE_FONT}px monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('COLOUR LEGEND', LEGEND_PAD, titleY)

  entries.forEach((entry, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    const x = LEGEND_PAD + col * (entryWidth + LEGEND_COL_GAP)
    const y = entriesTop + row * LEGEND_ROW_H
    const swatchY = y + (LEGEND_ROW_H - LEGEND_SWATCH) / 2

    // Swatch — same fill as the guide cell so the legend reads as a key.
    ctx.fillStyle = entry.color.hex
    ctx.fillRect(x, swatchY, LEGEND_SWATCH, LEGEND_SWATCH)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(x, swatchY, LEGEND_SWATCH, LEGEND_SWATCH)

    // Canonical code on the swatch, using the cell contrast rules.
    ctx.fillStyle = labelColor(entry.color.hex)
    ctx.font = `bold ${LEGEND_CODE_FONT}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(entry.code, x + LEGEND_SWATCH / 2, swatchY + LEGEND_SWATCH / 2)

    // Readable colour name on the white legend background.
    ctx.fillStyle = '#3D332A' // sand-700
    ctx.font = `${LEGEND_NAME_FONT}px monospace`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      entry.color.name,
      x + LEGEND_SWATCH + LEGEND_TEXT_GAP,
      swatchY + LEGEND_SWATCH / 2
    )
  })
}

/** Trigger a browser PNG download from a canvas element. */
function triggerDownload(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Draw one stud cell onto `ctx` at pixel position (x, y).
 * Mirrors the visual logic of StudCell.tsx.
 */
function drawStudCell(
  ctx: CanvasRenderingContext2D,
  color: LegoColor,
  x: number,
  y: number,
  size: number,
  renderMode: RenderMode
): void {
  const radius = Math.max(2, Math.round(size * 0.15))

  // ── Coloured background ─────────────────────────────────────────────────
  ctx.fillStyle = color.hex
  ctx.beginPath()
  ctx.roundRect(x, y, size, size, radius)
  ctx.fill()

  // ── Inset bottom shadow (approximates shadow-stud: inset 0 -2px …) ─────
  ctx.fillStyle = 'rgba(0,0,0,0.20)'
  ctx.fillRect(x, y + size - 2, size, 2)

  // ── Stud circle (stud mode only) ────────────────────────────────────────
  if (renderMode === 'stud') {
    const studR = size * 0.3 // radius = 60% diam / 2
    const cx = x + size / 2
    const cy = y + size / 2

    ctx.beginPath()
    ctx.arc(cx, cy, studR, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx, cy, studR, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.40)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Render the pixel matrix as LEGO pixel art and download as `brickr-export.png`.
 *
 * Null cells are rendered as the page background colour (sand-100) so
 * intentionally-removed bricks appear as blank squares rather than
 * transparent holes (which look odd in most image viewers).
 *
 * @param cellSize  Pixels per stud.  16 = compact; 24 = sharper detail.
 */
export function exportAsImage(
  matrix: (LegoColor | null)[][],
  renderMode: RenderMode,
  cellSize: number
): void {
  const rows = matrix.length
  if (rows === 0) return
  const cols = matrix[0]?.length ?? 0
  if (cols === 0) return

  const canvas = document.createElement('canvas')
  canvas.width = cols * cellSize
  canvas.height = rows * cellSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Sand-100 background so null cells match the app background
  ctx.fillStyle = '#F5F0E8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const color = matrix[row]?.[col]
      if (!color) continue
      drawStudCell(
        ctx,
        color,
        col * cellSize,
        row * cellSize,
        cellSize,
        renderMode
      )
    }
  }

  triggerDownload(canvas, 'brickr-export.png')
}

/**
 * Render a labeled instruction grid with Excel-style coordinates (A1, B2…)
 * plus a colour-code legend, and download as
 * `brickr-guide-<width>x<height>.png`.
 *
 * Layout
 * ──────
 * ┌──────┬─────┬─────┬── … ──┐
 * │ BKR  │  A  │  B  │       │  ← column-letter header row
 * ├──────┼─────┼─────┼── … ──┤
 * │  1   │[WH] │[BP] │       │  ← data row (coloured + canonical code)
 * │  2   │[DG] │[PU] │       │
 * │  …   │     │     │       │
 * └──────┴─────┴─────┴── … ──┘
 *  COLOUR LEGEND
 *  [BP] Bright Pink   [PU] Bright Purple   …
 *
 * Each cell shows the canonical code from `COLOR_CODES`, and the legend
 * decodes every colour present in the matrix. The canvas grows to fit the
 * legend below the grid, so the two never overlap.
 */
export function exportBuildGuide(
  matrix: (LegoColor | null)[][],
  gridDimensions: GridDimensions
): void {
  const rows = matrix.length
  if (rows === 0) return
  const cols = matrix[0]?.length ?? 0
  if (cols === 0) return

  const C = GUIDE_CELL
  const HW = GUIDE_HDR_W
  const HH = GUIDE_HDR_H
  const G = GUIDE_GAP

  const gridW = HW + cols * (C + G) + G
  const gridH = HH + rows * (C + G) + G

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // ── Legend sizing ────────────────────────────────────────────────────
  // The legend is measured first so the canvas can be widened when a single
  // entry does not fit the grid width (e.g. a 12×12 guide with long colour
  // names). Canvas width/height are set after measuring, because assigning
  // them resets the 2D context state.
  const legendEntries = collectLegendEntries(matrix)
  const entryWidth = measureLegendEntryWidth(ctx, legendEntries)
  const legend = legendLayout(legendEntries, entryWidth, gridW)

  const canvasW = Math.max(gridW, legend.width)
  canvas.width = canvasW
  canvas.height = gridH + legend.height

  // ── White background ──────────────────────────────────────────────────
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvasW, canvas.height)

  // ── Grid lines (sand-300 colour) ──────────────────────────────────────
  ctx.strokeStyle = '#E8E0D0'
  ctx.lineWidth = G

  for (let col = 0; col <= cols; col++) {
    const x = HW + col * (C + G) + G * 0.5
    ctx.beginPath()
    ctx.moveTo(x, HH)
    ctx.lineTo(x, gridH)
    ctx.stroke()
  }
  for (let row = 0; row <= rows; row++) {
    const y = HH + row * (C + G) + G * 0.5
    ctx.beginPath()
    ctx.moveTo(HW, y)
    ctx.lineTo(gridW, y)
    ctx.stroke()
  }

  // ── Column headers (A, B, C … AA, AB …) ──────────────────────────────
  ctx.fillStyle = '#9E9080' // sand-500
  ctx.font = `bold ${GUIDE_HDR_FONT}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let col = 0; col < cols; col++) {
    const x = HW + col * (C + G) + G + C / 2
    ctx.fillText(colLabel(col), x, HH / 2)
  }

  // ── Row headers (1, 2, 3 …) ───────────────────────────────────────────
  for (let row = 0; row < rows; row++) {
    const y = HH + row * (C + G) + G + C / 2
    ctx.fillText(String(row + 1), HW / 2, y)
  }

  // ── Data cells ────────────────────────────────────────────────────────
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const color = matrix[row]?.[col]
      const x = HW + col * (C + G) + G
      const y = HH + row * (C + G) + G

      if (!color) continue // null = blank white square (already background)

      // Cell background
      ctx.fillStyle = color.hex
      ctx.fillRect(x, y, C, C)

      // Canonical code — light or dark based on perceived luminance
      ctx.fillStyle = labelColor(color.hex)
      ctx.font = `bold ${GUIDE_FONT}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(getColorCode(color), x + C / 2, y + C / 2)
    }
  }

  // ── Branding corner (top-left cell) ──────────────────────────────────
  ctx.fillStyle = '#1A1A1A' // brick-black
  ctx.fillRect(0, 0, HW, HH)
  ctx.fillStyle = '#FAFAF8' // brick-white
  ctx.font = `bold 7px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('BKR', HW / 2, HH / 2)

  // ── Colour legend (below the grid, never overlapping it) ─────────────
  drawLegend(ctx, legendEntries, entryWidth, legend.cols, gridH)

  triggerDownload(
    canvas,
    `brickr-guide-${gridDimensions.width}x${gridDimensions.height}.png`
  )
}
