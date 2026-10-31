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

import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  ConversionSettings,
  GridDimension,
  LegoColor,
  PieceCount,
} from '@/types'
import {
  defaultConversionSettings,
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
  /** Reset all state to initial values, invalidating any in-flight request. */
  reset: () => void
  /**
   * Run the full pipeline: resize → quantise → messiness → counts.
   *
   * Resolves when state has been updated.  Rejects only on unexpected
   * exceptions — normal errors are captured into the `error` field instead.
   *
   * Every call supersedes all earlier in-flight calls: only the most recent
   * request may write state, so a slow older request can never overwrite a
   * newer result (or clear its loading state).
   */
  process: (
    file: File,
    width: GridDimension,
    height: GridDimension,
    messiness: number,
    settings?: ConversionSettings
  ) => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useImageProcessor(): UseImageProcessorReturn {
  const [matrix, setMatrix] = useState<LegoColor[][] | null>(null)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [pieceCounts, setPieceCounts] = useState<PieceCount[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Monotonically increasing request id. Bumped by every `process` call, by
   * `reset` and on unmount; an async run may only touch state while its own
   * id is still the current one.
   */
  const requestIdRef = useRef(0)

  const reset = useCallback(() => {
    // Invalidate any in-flight run so a late resolution can't repopulate state
    requestIdRef.current += 1
    setMatrix(null)
    setImageData(null)
    setPieceCounts([])
    setError(null)
    setIsProcessing(false)
  }, [])

  // Invalidate in-flight runs on unmount so they can't write to a dead component
  useEffect(() => {
    return () => {
      requestIdRef.current += 1
    }
  }, [])

  const process = useCallback(
    async (
      file: File,
      width: GridDimension,
      height: GridDimension,
      messiness: number,
      settings: ConversionSettings = defaultConversionSettings()
    ): Promise<void> => {
      const requestId = ++requestIdRef.current
      const isCurrent = () => requestIdRef.current === requestId

      setIsProcessing(true)
      setError(null)

      try {
        // Step 1 — Resize to the target grid resolution
        const newImageData = await resizeImage(file, width, height, settings)

        // A newer request (or a reset) superseded this one while we awaited
        if (!isCurrent()) return

        // Step 2 — Quantise pixels to the LEGO palette + apply messiness
        const newMatrix = buildPixelMatrix(newImageData, messiness, settings)

        // Step 3 — Compute per-colour piece counts
        const counts = computePieceCounts(newMatrix)

        // Still the latest request? Commit every result field together so the
        // matrix, image data and counts always describe the same conversion.
        if (!isCurrent()) return

        setImageData(newImageData)
        setMatrix(newMatrix)
        setPieceCounts(counts)
      } catch (err) {
        // A stale failure must not replace a newer success or error status
        if (!isCurrent()) return
        const message =
          err instanceof Error ? err.message : 'Failed to process image.'
        setError(message)
        // Keep the previous matrix/counts visible so the UI doesn't go blank
      } finally {
        // Only the latest request owns the loading flag — a stale run's
        // finally must not clear the spinner of a newer one
        if (isCurrent()) setIsProcessing(false)
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
