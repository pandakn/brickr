/**
 * Brickr — image processing pipeline
 *
 * All functions run browser-side via the Canvas API.  Never call these from
 * Server Components or API routes.
 *
 * Pipeline
 * ────────
 *  resizeImage()       File → ImageData  (offscreen canvas resize)
 *  buildPixelMatrix()  ImageData → LegoColor[][]  (quantise + messiness)
 *  computePieceCounts() LegoColor[][] → PieceCount[]  (stats)
 */

import type {
  ConversionSettings,
  GridDimension,
  LegoColor,
  PieceCount,
} from '@/types'
import { LEGO_PALETTE } from './legoColors'
import { deltaE, nearestLegoColor } from './colorMapping'

// ─── PRNG — mulberry32 ────────────────────────────────────────────────────
//
// Produces a deterministic, uniform pseudo-random sequence from a 32-bit seed.
// Reference: Tommy Ettinger, https://gist.github.com/tommyettinger/46a874533244883189143505d203312c

function seededRandom(seed: number): () => number {
  let s = seed >>> 0 // force unsigned 32-bit
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

// ─── Seed derivation — FNV-1a ─────────────────────────────────────────────
//
// Derives a reproducible 32-bit seed from a matrix of LEGO colours so that
// the same image + same messiness always yields identical output.

function deriveMatrixSeed(matrix: LegoColor[][]): number {
  let hash = 0x811c9dc5 // FNV-1a offset basis
  for (const row of matrix) {
    for (const cell of row) {
      for (let i = 0; i < cell.id.length; i++) {
        hash ^= cell.id.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193) // FNV-1a prime
      }
    }
  }
  return hash >>> 0 // unsigned 32-bit
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Resize `file` to a `width × height` grid using the browser's Canvas API
 * and return the raw `ImageData`.
 *
 * Aspect ratio is preserved using the selected contain/cover frame, crop
 * position, and zoom settings.
 *
 * Transparent pixels are alpha-composited against white so the colour-mapping
 * step always receives fully-opaque RGB values.
 */
export async function resizeImage(
  file: File,
  width: GridDimension,
  height: GridDimension,
  settings: ConversionSettings = defaultConversionSettings()
): Promise<ImageData> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not acquire a 2D canvas context')

    const placement = calculateImagePlacement({
      sourceWidth: bitmap.width,
      sourceHeight: bitmap.height,
      targetWidth: width,
      targetHeight: height,
      settings: settings.framing,
    })

    // White background so transparent areas map to White rather than Black.
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.imageSmoothingEnabled = settings.profile !== 'pixel-art'
    if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      bitmap,
      placement.left,
      placement.top,
      placement.width,
      placement.height
    )
    return ctx.getImageData(0, 0, width, height)
  } finally {
    bitmap.close()
  }
}

/**
 * Introduce controlled randomness into an already-quantised matrix.
 *
 * At `messiness = 0`  → no change.
 * At `messiness = 100` → ~30 % of cells are swapped with a palette entry
 *   that is up to 3 positions away in the palette array, producing a
 *   handmade / imperfect-sort-of-your-brick-bin aesthetic.
 *
 * The result is fully reproducible: the same matrix + same messiness always
 * yields the same output because the PRNG seed is derived from the matrix
 * content via FNV-1a.
 */
export function applyMessiness(
  matrix: LegoColor[][],
  messiness: number
): LegoColor[][] {
  if (messiness === 0) return matrix

  const rand = seededRandom(deriveMatrixSeed(matrix))

  // Probability that any individual cell gets swapped (0 → 0 %, 100 → 30 %)
  const swapProb = (messiness / 100) * 0.3

  // Maximum palette-index offset grows with messiness (1 at m≈33, 3 at m=100)
  const maxOffset = Math.max(1, Math.round((messiness / 100) * 3))

  return matrix.map((row) =>
    row.map((cell) => {
      if (rand() >= swapProb) return cell

      // Find the current colour's position in the palette
      const currentIdx = LEGO_PALETTE.findIndex((c) => c.id === cell.id)
      if (currentIdx === -1) return cell

      // Pick a random signed offset in [-maxOffset, +maxOffset]
      const offset = Math.round((rand() * 2 - 1) * maxOffset)
      const newIdx = Math.max(
        0,
        Math.min(LEGO_PALETTE.length - 1, currentIdx + offset)
      )
      return LEGO_PALETTE[newIdx]
    })
  )
}

/**
 * Convert raw `ImageData` (from `resizeImage`) into a 2-D matrix of LEGO
 * colours and optionally apply messiness distortion.
 *
 * Algorithm per pixel:
 *   1. Read R, G, B from ImageData.data (alpha already blended by canvas).
 *   2. Find the nearest LEGO colour via CIE76 ΔE in L*a*b* space.
 *   3. After the full matrix is built, apply `applyMessiness`.
 *
 * Returns `matrix[row][col]`.
 */
export function buildPixelMatrix(
  imageData: ImageData,
  messiness: number,
  settings: ConversionSettings = defaultConversionSettings()
): LegoColor[][] {
  const { width, height, data } = imageData
  const matrix: LegoColor[][] = []

  for (let row = 0; row < height; row++) {
    const rowArray: LegoColor[] = []
    for (let col = 0; col < width; col++) {
      const i = (row * width + col) * 4 // index into flat RGBA array
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3] / 255

      // Composite transparent pixels against white (LEGO baseplates are white)
      const cr = Math.round(r * a + 255 * (1 - a))
      const cg = Math.round(g * a + 255 * (1 - a))
      const cb = Math.round(b * a + 255 * (1 - a))

      rowArray.push(nearestLegoColor(cr, cg, cb))
    }
    matrix.push(rowArray)
  }

  const messy = applyMessiness(matrix, messiness)
  return settings.profile === 'avatar'
    ? limitMatrixColors(messy, settings.maxColors)
    : messy
}

export function defaultConversionSettings(): ConversionSettings {
  return {
    profile: 'photo',
    framing: { fit: 'contain', zoom: 1, positionX: 0.5, positionY: 0.5 },
  }
}

export function calculateImagePlacement({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  settings,
}: {
  sourceWidth: number
  sourceHeight: number
  targetWidth: number
  targetHeight: number
  settings: ConversionSettings['framing']
}): { left: number; top: number; width: number; height: number } {
  const scaleX = targetWidth / sourceWidth
  const scaleY = targetHeight / sourceHeight
  const fitScale =
    settings.fit === 'cover'
      ? Math.max(scaleX, scaleY)
      : Math.min(scaleX, scaleY)
  const scale = fitScale * clamp(settings.zoom, 1, 3)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  const overflowX = Math.max(0, width - targetWidth)
  const overflowY = Math.max(0, height - targetHeight)

  return {
    left: overflowX
      ? -overflowX * clamp(settings.positionX, 0, 1)
      : (targetWidth - width) / 2,
    top: overflowY
      ? -overflowY * clamp(settings.positionY, 0, 1)
      : (targetHeight - height) / 2,
    width,
    height,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min
}

function limitMatrixColors(
  matrix: LegoColor[][],
  requestedLimit: number
): LegoColor[][] {
  const limit = Math.round(clamp(requestedLimit, 2, 8))
  const counts = new Map<string, { color: LegoColor; count: number }>()
  for (const row of matrix) {
    for (const color of row) {
      const current = counts.get(color.id)
      if (current) current.count++
      else counts.set(color.id, { color, count: 1 })
    }
  }

  const paletteOrder = new Map(
    LEGO_PALETTE.map((color, index) => [color.id, index])
  )
  const allowed = [...counts.values()]
    .sort(
      (a, b) =>
        b.count - a.count ||
        (paletteOrder.get(a.color.id) ?? 0) -
          (paletteOrder.get(b.color.id) ?? 0)
    )
    .slice(0, limit)
    .map(({ color }) => color)

  return matrix.map((row) =>
    row.map((color) => {
      let nearest = allowed[0]
      let bestDistance = deltaE(color.lab, nearest.lab)
      for (const candidate of allowed.slice(1)) {
        const distance = deltaE(color.lab, candidate.lab)
        if (distance < bestDistance) {
          nearest = candidate
          bestDistance = distance
        }
      }
      return nearest
    })
  )
}

/**
 * Aggregate the pixel matrix into per-colour piece counts.
 *
 * Accepts `(LegoColor | null)[][]` so it can be called both immediately after
 * `buildPixelMatrix` (no nulls) and after the user has manually removed cells
 * (some nulls).  Null cells are excluded from totals and percentages.
 *
 * Returns results sorted by count descending (most-used colour first).
 */
export function computePieceCounts(
  matrix: (LegoColor | null)[][]
): PieceCount[] {
  const counts = new Map<string, { color: LegoColor; count: number }>()
  let total = 0

  for (const row of matrix) {
    for (const cell of row) {
      if (cell === null) continue
      total++
      const entry = counts.get(cell.id)
      if (entry) {
        entry.count++
      } else {
        counts.set(cell.id, { color: cell, count: 1 })
      }
    }
  }

  if (total === 0) return []

  return [...counts.values()]
    .map(({ color, count }) => ({
      color,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count)
}
