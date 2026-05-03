'use client'

/**
 * useBrickCanvas
 *
 * Owns the complete BrickState and all the actions that mutate it.
 *
 * Design notes
 * ────────────
 * • `latestState` ref  — lets rAF callbacks read current state without
 *   being listed as useCallback deps (avoids stale closures).
 * • `originalMatrixRef` — stores the clean, user-edit-free matrix so
 *   `handleCellClick` can restore removed cells without re-processing.
 * • `buildKey`         — integer that increments on every `startBuild()` call.
 *   BrickCanvas embeds it in cell keys, which forces StudCell remounts so
 *   `animate-build-in` replays for each new build sequence.
 * • rAF progress loop  — state is updated at most ~10× per second so the
 *   progress bar is smooth without triggering 60 re-renders per second.
 */

import { useState, useCallback, useRef } from 'react'
import type { BrickState, GridDimensions, LegoColor, RenderMode } from '@/types'

// ─── Default state ────────────────────────────────────────────────────────

const DEFAULT_STATE: BrickState = {
  originalImage: null,
  pixelMatrix: [],
  gridDimensions: { width: 32, height: 32 },
  messiness: 0,
  renderMode: 'stud',
  showGrid: false,
  isBuilding: false,
  buildProgress: 0,
}

// ─── Return type ──────────────────────────────────────────────────────────

export type UseBrickCanvasReturn = {
  state: BrickState
  /**
   * Monotonically increasing counter.  Embed in StudCell keys so that
   * pressing "Build it" forces a remount and replays `animate-build-in`.
   */
  buildKey: number
  /**
   * Load the result of useImageProcessor into canvas state.
   * `imageData` should be the resized (gridSize × gridSize) ImageData so
   * individual pixels can be looked up by cell index for restoration.
   */
  loadImage: (matrix: LegoColor[][], imageData: ImageData) => void
  setGridDimensions: (dims: GridDimensions) => void
  setMessiness: (value: number) => void
  setRenderMode: (mode: RenderMode) => void
  toggleGrid: () => void
  /**
   * Kick off the progressive build animation.
   * Sets isBuilding → true, animates buildProgress 0 → 1 over
   * (width × height × 16 ms), then sets isBuilding → false.
   */
  startBuild: () => void
  /**
   * Toggle a cell between its mapped colour and null (removed).
   * Restoring a null cell looks up the original (pre-edit) matrix so the
   * result matches what the image processor produced, not a re-computation.
   */
  handleCellClick: (row: number, col: number) => void
  reset: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useBrickCanvas(): UseBrickCanvasReturn {
  const [state, setState] = useState<BrickState>(DEFAULT_STATE)
  const [buildKey, setBuildKey] = useState(0)

  /**
   * Tracks the current gridDimensions so rAF callbacks in startBuild can read it
   * without being listed as useCallback deps.
   * Only mutated inside setGridDimensions, loadImage, and reset — never during render.
   */
  const gridDimensionsRef = useRef<GridDimensions>(
    DEFAULT_STATE.gridDimensions
  )

  /** Clean matrix from image processor, used to restore removed cells. */
  const originalMatrixRef = useRef<LegoColor[][]>([])

  /** requestAnimationFrame handle so in-flight builds can be cancelled. */
  const buildRafRef = useRef<number | null>(null)

  // ── loadImage ────────────────────────────────────────────────────────────

  const loadImage = useCallback(
    (matrix: LegoColor[][], imageData: ImageData): void => {
      originalMatrixRef.current = matrix
      setState((prev) => {
        gridDimensionsRef.current = prev.gridDimensions // keep ref in sync on load
        return {
          ...prev,
          originalImage: imageData,
          pixelMatrix: matrix,
          isBuilding: false,
          buildProgress: 0,
        }
      })
    },
    []
  )

  // ── setGridDimensions ────────────────────────────────────────────────────

  const setGridDimensions = useCallback((dims: GridDimensions): void => {
    gridDimensionsRef.current = dims
    setState((prev) => ({ ...prev, gridDimensions: dims }))
  }, [])

  // ── setMessiness ─────────────────────────────────────────────────────────

  const setMessiness = useCallback((value: number): void => {
    setState((prev) => ({
      ...prev,
      messiness: Math.max(0, Math.min(100, value)),
    }))
  }, [])

  // ── setRenderMode ────────────────────────────────────────────────────────

  const setRenderMode = useCallback((mode: RenderMode): void => {
    setState((prev) => ({ ...prev, renderMode: mode }))
  }, [])

  // ── toggleGrid ───────────────────────────────────────────────────────────

  const toggleGrid = useCallback((): void => {
    setState((prev) => ({ ...prev, showGrid: !prev.showGrid }))
  }, [])

  // ── startBuild ───────────────────────────────────────────────────────────

  const startBuild = useCallback((): void => {
    // Guard: originalMatrixRef is populated only after loadImage has been called
    if (originalMatrixRef.current.length === 0) return

    // Cancel any in-flight animation from a previous build
    if (buildRafRef.current !== null) {
      cancelAnimationFrame(buildRafRef.current)
      buildRafRef.current = null
    }

    // Read gridDimensions from the ref (safe: not a render-phase read)
    const dims = gridDimensionsRef.current
    // Total animation duration: each cell reveals 16 ms after the previous one
    const totalDuration = dims.width * dims.height * 16

    // Increment buildKey so BrickCanvas remounts cells → animate-build-in replays
    setBuildKey((k) => k + 1)
    setState((prev) => ({ ...prev, isBuilding: true, buildProgress: 0 }))

    const startTime = performance.now()
    let lastUpdate = 0

    function tick(timestamp: number): void {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / totalDuration, 1)

      // Throttle setState to ≈ 10 fps so the progress bar stays smooth
      // without triggering a re-render on every 16 ms rAF tick.
      if (timestamp - lastUpdate >= 100 || progress >= 1) {
        setState((prev) => ({ ...prev, buildProgress: progress }))
        lastUpdate = timestamp
      }

      if (progress < 1) {
        buildRafRef.current = requestAnimationFrame(tick)
      } else {
        setState((prev) => ({ ...prev, isBuilding: false, buildProgress: 1 }))
        buildRafRef.current = null
      }
    }

    buildRafRef.current = requestAnimationFrame(tick)
  }, []) // empty deps — reads latest state via latestState ref

  // ── handleCellClick ──────────────────────────────────────────────────────

  const handleCellClick = useCallback((row: number, col: number): void => {
    setState((prev) => {
      const currentCell = prev.pixelMatrix[row]?.[col]

      if (currentCell !== null && currentCell !== undefined) {
        // ── Remove the cell ──────────────────────────────────────────────
        const newMatrix = prev.pixelMatrix.map((r, ri) =>
          ri === row ? r.map((c, ci) => (ci === col ? null : c)) : r
        )
        return { ...prev, pixelMatrix: newMatrix }
      } else {
        // ── Restore from original matrix ─────────────────────────────────
        const originalCell = originalMatrixRef.current[row]?.[col]
        if (!originalCell) return prev // nothing to restore (no image loaded)

        const newMatrix = prev.pixelMatrix.map((r, ri) =>
          ri === row ? r.map((c, ci) => (ci === col ? originalCell : c)) : r
        )
        return { ...prev, pixelMatrix: newMatrix }
      }
    })
  }, []) // empty deps — reads original matrix via ref

  // ── reset ────────────────────────────────────────────────────────────────

  const reset = useCallback((): void => {
    if (buildRafRef.current !== null) {
      cancelAnimationFrame(buildRafRef.current)
      buildRafRef.current = null
    }
    originalMatrixRef.current = []
    gridDimensionsRef.current = DEFAULT_STATE.gridDimensions
    setState(DEFAULT_STATE)
    setBuildKey(0)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────

  return {
    state,
    buildKey,
    loadImage,
    setGridDimensions,
    setMessiness,
    setRenderMode,
    toggleGrid,
    startBuild,
    handleCellClick,
    reset,
  }
}
