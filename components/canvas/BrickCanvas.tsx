'use client'

/**
 * BrickCanvas
 *
 * Renders the full pixel matrix as a CSS grid of StudCell components.
 *
 * Cell-size strategy
 * ──────────────────
 * A ResizeObserver watches the container div.  On every resize it computes
 *   cellSize = Math.floor(containerWidth / gridSize)
 * and re-renders.  The `cellSize` prop is used as the initial value (before
 * the first observer callback) so there is no layout flash.
 *
 * Scrollability
 * ─────────────
 * The outer container is `overflow-auto` so if the computed grid is wider or
 * taller than the viewport the user can scroll to see the whole canvas.
 *
 * Build animation
 * ───────────────
 * Each StudCell receives `animationDelay = linearIndex * 16` (ms) when
 * `isBuilding` is true, creating a progressive reveal effect.  When not
 * building, all delays are 0 (instant appearance).
 * The `buildKey` prop must be embedded in cell keys so that changing it
 * forces remounts, allowing animate-build-in to replay on each build.
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import type { LegoColor, RenderMode } from '@/types'
import { StudCell } from './StudCell'

// ─── Types ────────────────────────────────────────────────────────────────

export interface BrickCanvasProps {
  matrix: (LegoColor | null)[][]
  renderMode: RenderMode
  showGrid: boolean
  /**
   * Seed cell size used before the ResizeObserver fires.
   * Typically `Math.floor(availableWidth / gridSize)`.
   */
  cellSize: number
  isBuilding: boolean
  /**
   * Monotonically increasing counter from useBrickCanvas.buildKey.
   * Changing this value forces all StudCells to remount so their
   * animate-build-in replays.
   */
  buildKey: number
  onCellClick: (row: number, col: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────

export function BrickCanvas({
  matrix,
  renderMode,
  showGrid,
  cellSize,
  isBuilding,
  buildKey,
  onCellClick,
}: BrickCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [computedCellSize, setComputedCellSize] = useState(cellSize)

  // Number of columns = number of rows (square grid)
  const gridSize = matrix.length > 0 ? matrix[0].length : 0

  // ── Auto-compute cell size from container width ───────────────────────────
  useEffect(() => {
    if (gridSize === 0) return
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      const containerWidth = entry.contentRect.width
      // Subtract 1 px for each gap when showGrid is on
      const gapTotal = showGrid ? gridSize - 1 : 0
      const usable = containerWidth - gapTotal
      const size = Math.max(4, Math.floor(usable / gridSize))
      setComputedCellSize(size)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [gridSize, showGrid])

  // ── Grid layout via inline style (dynamic column count) ───────────────────
  // Using CSS custom-property grid avoids Tailwind's JIT scanning limitation
  // for dynamic column counts (grid-cols-[N] would need N to be statically
  // known at build time).
  const gridStyle = useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: `repeat(${gridSize}, ${computedCellSize}px)`,
      gap: showGrid ? '1px' : '0px',
      width: 'fit-content',
      // Crisp rendering — no anti-aliasing between adjacent cells
      imageRendering: 'pixelated' as const,
    }),
    [gridSize, computedCellSize, showGrid],
  )

  // ── Empty state ───────────────────────────────────────────────────────────
  if (matrix.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex h-full w-full items-center justify-center"
        aria-label="Empty brick canvas"
      />
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto"
      aria-label="LEGO brick canvas"
    >
      <div role="grid" style={gridStyle}>
        {matrix.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const linearIndex = rowIdx * gridSize + colIdx
            return (
              <StudCell
                // buildKey in the key forces remount on every new build so
                // animate-build-in replays correctly.
                key={`${buildKey}-${rowIdx}-${colIdx}`}
                color={cell}
                size={computedCellSize}
                renderMode={renderMode}
                animationDelay={isBuilding ? linearIndex * 16 : 0}
                onClick={() => onCellClick(rowIdx, colIdx)}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
