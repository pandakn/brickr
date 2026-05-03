'use client'

import { PixelatedCanvas } from '@/components/ui/pixelated-canvas'
import type { LegoColor } from '@/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface BrickCanvasProps {
  matrix: (LegoColor | null)[][]
  showGrid: boolean
  /**
   * Seed cell size used before the ResizeObserver fires.
   * Typically `Math.floor(availableWidth / gridSize)`.
   */
  cellSize: number
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
  showGrid,
  cellSize,
  onCellClick,
}: BrickCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const cols = matrix.length > 0 ? matrix[0].length : 0
  const rows = matrix.length

  // Compute the data URL from the matrix (memoized on buildKey + matrix reference)
  const dataUrl = useMemo(() => matrixToDataUrl(matrix), [matrix])

  // Observe the container to get available width/height
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

  // Compute cell size for the interaction overlay
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

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / computedCellSize)
      const row = Math.floor(y / computedCellSize)
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        onCellClick(row, col)
      }
    },
    [computedCellSize, rows, cols, onCellClick]
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
        {/* PixelatedCanvas renders the LEGO art with dot-grid effect */}
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
          className="absolute inset-0"
        />

        {/* Invisible overlay grid for click interactions */}
        <div
          data-testid="brick-canvas-grid"
          role="grid"
          className="absolute inset-0 cursor-pointer"
          onClick={handleCanvasClick}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${computedCellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${computedCellSize}px)`,
          }}
        >
          {matrix.flatMap((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                role="button"
                aria-label={cell ? cell.name : 'empty cell'}
                tabIndex={-1}
                className="focus:outline-none"
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
