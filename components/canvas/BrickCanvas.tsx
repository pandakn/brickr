'use client'

import { PixelatedCanvas } from '@/components/ui/pixelated-canvas'
import type { LegoColor, RenderMode } from '@/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

/**
 * Convert a LegoColor matrix to a data URL by rendering it on an offscreen
 * canvas. Each matrix cell becomes one pixel in the source image so that
 * PixelatedCanvas can re-sample and render it with its dot-grid effect.
 */
function matrixToDataUrl(matrix: (LegoColor | null)[][]): string {
  const rows = matrix.length
  if (rows === 0) return ''
  const cols = matrix[0].length
  if (cols === 0) return ''

  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = matrix[r][c]
      if (cell) {
        ctx.fillStyle = cell.hex
        ctx.fillRect(c, r, 1, 1)
      }
    }
  }

  return canvas.toDataURL()
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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const cols = matrix.length > 0 ? matrix[0].length : 0
  const rows = matrix.length

  const dataUrl = useMemo(() => matrixToDataUrl(matrix), [matrix])

  useEffect(() => {
    if (cols === 0 || rows === 0) return
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) })
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [cols, rows])

  const computedCellSize = useMemo(() => {
    if (
      canvasSize.width === 0 ||
      canvasSize.height === 0 ||
      cols === 0 ||
      rows === 0
    )
      return cellSize
    const gapW = showGrid ? cols - 1 : 0
    const gapH = showGrid ? rows - 1 : 0
    const usableW = canvasSize.width - gapW
    const usableH = canvasSize.height - gapH
    const cellW = Math.floor(usableW / cols)
    const cellH = Math.floor(usableH / rows)
    return Math.max(4, Math.min(cellW, cellH))
  }, [canvasSize, cols, rows, showGrid, cellSize])

  const gridWidth = cols * computedCellSize
  const gridHeight = rows * computedCellSize

  const gridStyle = useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: `repeat(${cols}, ${computedCellSize}px)`,
      gap: showGrid ? '1px' : '0px',
      width: 'fit-content',
    }),
    [cols, computedCellSize, showGrid]
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
      <div
        className="relative"
        style={{ width: gridWidth, height: gridHeight }}
      >
        {/* PixelatedCanvas — interactive swirl distortion background */}
        <PixelatedCanvas
          src={dataUrl}
          width={gridWidth}
          height={gridHeight}
          cellSize={computedCellSize}
          dotScale={0.85}
          shape="square"
          backgroundColor="transparent"
          dropoutStrength={0}
          distortionMode="swirl"
          distortionStrength={4}
          distortionRadius={60}
          followSpeed={0.15}
          jitterStrength={2}
          jitterSpeed={3}
          fadeOnLeave
          fadeSpeed={0.08}
          sampleAverage={false}
          objectFit="fill"
          className="pointer-events-none absolute inset-0"
        />

        {/* StudCell grid — LEGO stud visuals, hover, build animation, clicks */}
        <div
          role="grid"
          data-testid="brick-canvas-grid"
          className="absolute inset-0"
          style={gridStyle}
        >
          {matrix.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const linearIndex = rowIdx * cols + colIdx
              return (
                <StudCell
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
    </div>
  )
}
