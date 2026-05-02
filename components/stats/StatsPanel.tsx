'use client'

/**
 * StatsPanel
 *
 * Floating right panel showing aggregate statistics for the current canvas.
 *
 * Layout
 * ──────
 * • Large total piece count (font-black text-3xl)
 * • Estimated build time
 * • Fun situational message (>500 pieces or build complete)
 * • Progress bar when a build is in progress
 * • Full colour breakdown list
 */

import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import type { PieceCount } from '@/types'
import { ColorBreakdown } from './ColorBreakdown'

// ─── Types ────────────────────────────────────────────────────────────────

export interface StatsPanelProps {
  pieceCounts: PieceCount[]
  isBuilding: boolean
  buildProgress: number // 0–1
}

// ─── Component ────────────────────────────────────────────────────────────

export function StatsPanel({
  pieceCounts,
  isBuilding,
  buildProgress,
}: StatsPanelProps) {
  const totalPieces = useMemo(
    () => pieceCounts.reduce((sum, pc) => sum + pc.count, 0),
    [pieceCounts],
  )

  const buildTimeMin = Math.round((totalPieces * 15) / 60)

  // ── Fun contextual message ────────────────────────────────────────────────
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
      className={cn(
        // Floating panel — from DESIGN.md
        'fixed right-4 top-1/2 z-20 -translate-y-1/2',
        'w-56',
        'bg-sand-100/90 backdrop-blur-md',
        'border border-sand-300',
        'rounded-xl shadow-floating',
        'p-5',
        'transition-all duration-base',
        // Allow vertical scrolling if the colour list is tall
        'max-h-[calc(100vh-2rem)] overflow-y-auto',
      )}
    >
      {/* ── Total count ─────────────────────────────────────────────────── */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-sand-400">
        Total pieces
      </p>
      <p className="mt-0.5 font-display font-black text-3xl leading-none text-sand-800">
        {totalPieces > 0 ? totalPieces.toLocaleString() : '—'}
      </p>

      {/* ── Build time ──────────────────────────────────────────────────── */}
      {totalPieces > 0 && (
        <p className="mt-1 font-display text-sm text-sand-500">
          ≈ {buildTimeMin} min to build
        </p>
      )}

      {/* ── Fun message ─────────────────────────────────────────────────── */}
      {funMessage && (
        <p className="mt-2 font-display font-bold text-sm text-brick-orange">
          {funMessage}
        </p>
      )}

      {/* ── Build progress bar ──────────────────────────────────────────── */}
      {(isBuilding || buildProgress > 0) && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-sand-400">
              {isBuilding ? 'Building…' : 'Done'}
            </span>
            <span className="font-mono text-[10px] text-sand-400">
              {Math.round(buildProgress * 100)}%
            </span>
          </div>
          {/* Progress bar — from DESIGN.md */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-brick-red transition-all duration-base"
              style={{ width: `${buildProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="my-4 h-px w-full bg-sand-300" />

      {/* ── Colour breakdown ────────────────────────────────────────────── */}
      <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-sand-400">
        Colour breakdown
      </p>
      <ColorBreakdown pieceCounts={pieceCounts} />
    </div>
  )
}
