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
 *    → brickr-guide.png   (labeled instruction grid with Excel coordinates)
 */

import type { GridDimensions, LegoColor, RenderMode } from '@/types'

// ─── Guide layout constants ────────────────────────────────────────────────

const GUIDE_CELL = 28 // px — data cell size
const GUIDE_HDR_W = 28 // px — row-number column width
const GUIDE_HDR_H = 24 // px — column-label row height
const GUIDE_GAP = 1 // px — gap between cells (doubles as grid line)
const GUIDE_FONT = 9 // px — abbreviation text inside cells
const GUIDE_HDR_FONT = 8 // px — header label text

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
 * Short abbreviation for a LEGO colour, derived from its kebab-case `id`.
 *
 * Single-word ids  → first character uppercase:  "white"   → "W"
 * Multi-word ids   → initials of first two words: "dark-red" → "DR"
 *
 * All 20 palette entries produce unique abbreviations with this scheme.
 */
function colorAbbrev(color: LegoColor): string {
  const words = color.id.split('-')
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
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
 * and download as `brickr-guide.png`.
 *
 * Layout
 * ──────
 * ┌──────┬─────┬─────┬── … ──┐
 * │ BKR  │  A  │  B  │       │  ← column-letter header row
 * ├──────┼─────┼─────┼── … ──┤
 * │  1   │[W ] │[BR] │       │  ← data row (coloured + abbreviation)
 * │  2   │[DG] │[W ] │       │
 * │  …   │     │     │       │
 * └──────┴─────┴─────┴── … ──┘
 *
 * Each cell shows a 1–2 character abbreviation derived from the colour id.
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

  const canvasW = HW + cols * (C + G) + G
  const canvasH = HH + rows * (C + G) + G

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // ── White background ──────────────────────────────────────────────────
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // ── Grid lines (sand-300 colour) ──────────────────────────────────────
  ctx.strokeStyle = '#E8E0D0'
  ctx.lineWidth = G

  for (let col = 0; col <= cols; col++) {
    const x = HW + col * (C + G) + G * 0.5
    ctx.beginPath()
    ctx.moveTo(x, HH)
    ctx.lineTo(x, canvasH)
    ctx.stroke()
  }
  for (let row = 0; row <= rows; row++) {
    const y = HH + row * (C + G) + G * 0.5
    ctx.beginPath()
    ctx.moveTo(HW, y)
    ctx.lineTo(canvasW, y)
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

      // Abbreviation text — light or dark based on perceived luminance
      const onDark = hexLuma(color.hex) <= 0.35
      ctx.fillStyle = onDark ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.75)'
      ctx.font = `bold ${GUIDE_FONT}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(colorAbbrev(color), x + C / 2, y + C / 2)
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

  triggerDownload(
    canvas,
    `brickr-guide-${gridDimensions.width}x${gridDimensions.height}.png`
  )
}
