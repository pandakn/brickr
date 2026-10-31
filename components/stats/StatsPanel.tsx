'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { estimateBuildMinutes } from '@/lib/buildEstimate'
import type { GridDimensions, LegoColor, PieceCount, RenderMode } from '@/types'
import { exportAsImage, exportBuildGuide } from '@/lib/exportCanvas'
import { ColorBreakdown } from './ColorBreakdown'
import { Kbd } from '@/components/ui/kbd'

export interface StatsPanelProps {
  /**
   * Per-colour counts for the CURRENT committed matrix, derived via
   * `computePieceCounts(matrix)` in `app/page.tsx`. Empty cells never appear
   * here, so totals and build time only ever describe physical bricks.
   */
  pieceCounts: PieceCount[]
  isBuilding: boolean
  buildProgress: number // 0–1
  /** Current pixel matrix — needed for export. Pass null when no image is loaded. */
  matrix: (LegoColor | null)[][] | null
  gridDimensions: GridDimensions
  renderMode: RenderMode
  /**
   * True while a newer conversion is pending. Export is blocked so the user
   * can't download a result that no longer matches the requested settings.
   */
  isProcessing?: boolean
}

export function StatsPanel({
  pieceCounts,
  isBuilding,
  buildProgress,
  matrix,
  gridDimensions,
  renderMode,
  isProcessing = false,
}: StatsPanelProps) {
  const totalPieces = useMemo(
    () => pieceCounts.reduce((sum, pc) => sum + pc.count, 0),
    [pieceCounts]
  )

  const buildTimeMin = estimateBuildMinutes(totalPieces)
  const canExport = matrix !== null && matrix.length > 0

  const funMessage = useMemo(() => {
    if (!isBuilding && buildProgress === 1 && totalPieces > 0) {
      return 'Ready to build? 🧱'
    }
    if (totalPieces > 500) {
      return "That's a lot of bricks 👀"
    }
    return null
  }, [isBuilding, buildProgress, totalPieces])

  return (
    <div
      data-testid="stats-panel"
      className={cn(
        'bg-sand-100/90 backdrop-blur-md',
        'border border-sand-300',
        'p-5 shadow-floating'
      )}
    >
      <p className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
        Total pieces
      </p>
      <p
        data-testid="total-pieces"
        className="mt-0.5 font-display text-3xl leading-none font-black text-sand-800"
      >
        {totalPieces > 0 ? totalPieces.toLocaleString() : '—'}
      </p>

      {totalPieces > 0 && (
        <p
          data-testid="build-time"
          className="mt-1 font-display text-sm text-sand-500"
        >
          ≈ {buildTimeMin} min to build
        </p>
      )}

      {funMessage && (
        <p
          data-testid="fun-message"
          className="mt-2 font-display text-sm font-bold text-brick-orange"
        >
          {funMessage}
        </p>
      )}

      {(isBuilding || buildProgress > 0) && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <span
              data-testid="build-status"
              className="font-mono text-[10px] tracking-widest text-sand-400 uppercase"
            >
              {isBuilding ? 'Building…' : 'Done'}
            </span>
            <span
              data-testid="build-progress-percent"
              className="font-mono text-[10px] text-sand-400"
            >
              {Math.round(buildProgress * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              data-testid="build-progress-bar"
              className="duration-base h-full rounded-full bg-brick-red transition-all"
              style={{ width: `${buildProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="my-4 h-px w-full bg-sand-300" />

      <p className="mb-3 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
        Colour breakdown
      </p>
      <ColorBreakdown pieceCounts={pieceCounts} />

      {canExport && (
        <>
          <div className="my-4 h-px w-full bg-sand-300" />

          <p className="mb-3 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
            Export
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              data-testid="export-image-button"
              onClick={() => exportAsImage(matrix, renderMode, 16)}
              disabled={isProcessing}
              className={cn(
                'flex w-full items-center justify-between rounded-md border-[1.5px] px-3 py-2',
                'font-display text-xs font-extrabold text-sand-700',
                'border-sand-300 bg-sand-200',
                'duration-micro transition-all',
                'hover:bg-sand-300 active:scale-[0.97]',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
              )}
            >
              <span>↓ Download art</span>
              <Kbd className="border-sand-400/20 bg-sand-300/50 text-sand-500">
                E
              </Kbd>
            </button>

            <button
              type="button"
              data-testid="export-guide-button"
              onClick={() => exportBuildGuide(matrix, gridDimensions)}
              disabled={isProcessing}
              className={cn(
                'flex w-full items-center justify-between rounded-md border-[1.5px] px-3 py-2',
                'font-display text-xs font-extrabold text-sand-700',
                'border-sand-300 bg-sand-200',
                'duration-micro transition-all',
                'hover:bg-sand-300 active:scale-[0.97]',
                'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
              )}
            >
              <span>↓ Download guide</span>
              <Kbd className="border-sand-400/20 bg-sand-300/50 text-sand-500">
                D
              </Kbd>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
