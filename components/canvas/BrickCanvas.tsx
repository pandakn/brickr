'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import type { LegoColor, RenderMode } from '@/types'
import { StudCell } from './StudCell'

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

  useEffect(() => {
    if (gridSize === 0) return
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      // Subtract 1 px for each gap when showGrid is on
      const gapTotal = showGrid ? gridSize - 1 : 0
      const usableW = width - gapTotal
      const usableH = height - gapTotal
      const size = Math.max(4, Math.floor(Math.min(usableW, usableH) / gridSize))
      setComputedCellSize(size)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [gridSize, showGrid])

  const gridStyle = useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: `repeat(${gridSize}, ${computedCellSize}px)`,
      gap: showGrid ? '1px' : '0px',
      width: 'fit-content',
      // Crisp rendering — no anti-aliasing between adjacent cells
      imageRendering: 'pixelated' as const,
    }),
    [gridSize, computedCellSize, showGrid]
  )

  if (matrix.length === 0) {
    return (
      <div
        ref={containerRef}
        data-testid="brick-canvas-empty"
        className="flex h-full w-full items-center justify-center"
        aria-label="Empty brick canvas"
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
      aria-label="LEGO brick canvas"
    >
      <div role="grid" data-testid="brick-canvas-grid" style={gridStyle}>
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
          })
        )}
      </div>
    </div>
  )
}
