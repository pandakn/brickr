'use client'

/**
 * useImageProcessor
 *
 * Wraps the image-processing pipeline (resizeImage → buildPixelMatrix →
 * computePieceCounts) in React state.  All work happens browser-side via the
 * Canvas API — no server round-trips.
 *
 * Usage
 * ─────
 *   const { matrix, pieceCounts, isProcessing, error, process } =
 *     useImageProcessor()
 *
 *   // When the user picks a file:
 *   await process(file, 32, 32, 20)   // width=32, height=32, messiness=20
 */

import { useState, useCallback } from 'react'
import type { GridDimension, LegoColor, PieceCount } from '@/types'
import {
  resizeImage,
  buildPixelMatrix,
  computePieceCounts,
} from '@/lib/imageProcessor'

// ─── Types ────────────────────────────────────────────────────────────────

export type UseImageProcessorReturn = {
  /** The quantised LEGO colour matrix, or null before the first process call. */
  matrix: LegoColor[][] | null
  /**
   * The resized ImageData that produced `matrix` (gridSize × gridSize pixels).
   * Passed to useBrickCanvas.loadImage so it can be stored in BrickState.
   */
  imageData: ImageData | null
  /** Per-colour piece counts, sorted by count descending. */
  pieceCounts: PieceCount[]
  /** True while the pipeline is running. */
  isProcessing: boolean
  /** Human-readable error message, or null when healthy. */
  error: string | null
  /**
   * Run the full pipeline: resize → quantise → messiness → counts.
   *
   * Resolves when state has been updated.  Rejects only on unexpected
   * exceptions — normal errors are captured into the `error` field instead.
   */
  /** Reset all state to initial values. */
  reset: () => void
  process: (
    file: File,
    width: GridDimension,
    height: GridDimension,
    messiness: number
  ) => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useImageProcessor(): UseImageProcessorReturn {
  const [matrix, setMatrix] = useState<LegoColor[][] | null>(null)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [pieceCounts, setPieceCounts] = useState<PieceCount[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setMatrix(null)
    setImageData(null)
    setPieceCounts([])
    setError(null)
    setIsProcessing(false)
  }, [])

  const process = useCallback(
    async (
      file: File,
      width: GridDimension,
      height: GridDimension,
      messiness: number
    ): Promise<void> => {
      setIsProcessing(true)
      setError(null)

      try {
        // Step 1 — Resize to the target grid resolution
        const newImageData = await resizeImage(file, width, height)

        // Step 2 — Quantise pixels to the LEGO palette + apply messiness
        const newMatrix = buildPixelMatrix(newImageData, messiness)

        // Step 3 — Compute per-colour piece counts
        const counts = computePieceCounts(newMatrix)

        setImageData(newImageData)
        setMatrix(newMatrix)
        setPieceCounts(counts)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to process image.'
        setError(message)
        // Keep the previous matrix/counts visible so the UI doesn't go blank
      } finally {
        setIsProcessing(false)
      }
    },
    [] // no external dependencies — pipeline functions are module-level
  )

  return {
    matrix,
    imageData,
    pieceCounts,
    isProcessing,
    error,
    reset,
    process,
  }
}
