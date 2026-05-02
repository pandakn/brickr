/**
 * Brickr — shared TypeScript types
 * This file is the single source of truth for every type used across the app.
 * Import from here, not from individual component files.
 */

// ─── Colour ────────────────────────────────────────────────────────────────

/**
 * A single entry in the LEGO colour palette.
 * `lab` is pre-computed from `hex` using the standard sRGB → XYZ → CIE L*a*b*
 * conversion (D65 illuminant) so colour-matching never needs to re-derive it.
 */
export type LegoColor = {
  id: string
  name: string
  hex: string
  lab: [number, number, number] // [L, a, b]
}

// ─── Canvas configuration ──────────────────────────────────────────────────

/** How many LEGO studs to render along each axis. */
export type GridSize = 12 | 32 | 64

/** Whether cells render as a flat square or a square with a raised circular stud. */
export type RenderMode = 'flat' | 'stud'

// ─── Application state ─────────────────────────────────────────────────────

/**
 * The complete state managed by `useBrickCanvas`.
 * `pixelMatrix[row][col]` is `null` for cells that have been manually removed.
 */
export type BrickState = {
  /** The source image data at original resolution, before downsampling. */
  originalImage: ImageData | null
  /** 2-D grid of mapped LEGO colours. null = cell removed by the user. */
  pixelMatrix: (LegoColor | null)[][]
  gridSize: GridSize
  /** 0–100. Higher values introduce random colour variation across cells. */
  messiness: number
  renderMode: RenderMode
  /** Draw a 1-px gap between cells so individual bricks are visible. */
  showGrid: boolean
  /** True while the progressive build animation is running. */
  isBuilding: boolean
  /** 0–1. Fraction of cells that have been "revealed" during the build. */
  buildProgress: number
}

// ─── Statistics ────────────────────────────────────────────────────────────

/**
 * Aggregated piece-count data for one colour in the current matrix.
 * Used by `StatsPanel` and `ColorBreakdown`.
 */
export type PieceCount = {
  color: LegoColor
  count: number
  /** Fraction of total non-null cells, expressed as 0–100. */
  percentage: number
}
