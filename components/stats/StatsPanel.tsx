"use client"

/**
 * StatsPanel
 *
 * Floating right panel — stats, progress, colour breakdown, and export.
 *
 * Layout
 * ──────
 * • Large total piece count (`font-black text-3xl`)
 * • Estimated build time
 * • Fun situational message (>500 pieces / build complete)
 * • Progress bar while building
 * • Full colour breakdown list
 * • Export buttons (shown only when a matrix is available)
 */

import { useMemo } from "react"
import { cn } from "@/lib/cn"
import type { GridSize, LegoColor, PieceCount, RenderMode } from "@/types"
import { exportAsImage, exportBuildGuide } from "@/lib/exportCanvas"
import { ColorBreakdown } from "./ColorBreakdown"
import { Kbd } from "@/components/ui/kbd"

// ─── Types ────────────────────────────────────────────────────────────────

export interface StatsPanelProps {
  pieceCounts: PieceCount[]
  isBuilding: boolean
  buildProgress: number // 0–1
  /** Current pixel matrix — needed for export. Pass null when no image is loaded. */
  matrix: (LegoColor | null)[][] | null
  gridSize: GridSize
  renderMode: RenderMode
  /**
   * On mobile (< lg) the panel is hidden by default.
   * Set to true to make it visible as a bottom sheet on small screens.
   */
  mobileVisible?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────

export function StatsPanel({
  pieceCounts,
  isBuilding,
  buildProgress,
  matrix,
  gridSize,
  renderMode,
  mobileVisible = false,
}: StatsPanelProps) {
  const totalPieces = useMemo(
    () => pieceCounts.reduce((sum, pc) => sum + pc.count, 0),
    [pieceCounts]
  )

  const buildTimeMin = Math.round((totalPieces * 15) / 60)
  const canExport = matrix !== null && matrix.length > 0

  // ── Fun contextual message ────────────────────────────────────────────────
  const funMessage = useMemo(() => {
    if (!isBuilding && buildProgress === 1 && totalPieces > 0) {
      return "Ready to build? 🧱"
    }
    if (totalPieces > 500) {
      return "That's a lot of bricks 👀"
    }
    return null
  }, [isBuilding, buildProgress, totalPieces])

  return (
    <div
      className={cn(
        // Shared
        "bg-sand-100/90 backdrop-blur-md",
        "border border-sand-300",
        "z-20 p-5 shadow-floating",
        "duration-base transition-all",
        // ── Mobile: bottom sheet, hidden unless mobileVisible ─────────────
        "fixed right-0 bottom-0 left-0",
        "max-h-[70vh] overflow-y-auto rounded-t-xl",
        mobileVisible ? "translate-y-0" : "translate-y-full",
        // ── Desktop: right sidebar ────────────────────────────────────────
        "lg:translate-y-0", // always un-translated on desktop
        "lg:right-4 lg:bottom-auto lg:left-auto",
        "lg:top-1/2 lg:-translate-y-1/2",
        "lg:w-56 lg:rounded-xl",
        "lg:max-h-[calc(100vh-2rem)]"
      )}
    >
      {/* ── Total count ─────────────────────────────────────────────────── */}
      <p className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
        Total pieces
      </p>
      <p className="mt-0.5 font-display text-3xl leading-none font-black text-sand-800">
        {totalPieces > 0 ? totalPieces.toLocaleString() : "—"}
      </p>

      {/* ── Build time estimate ──────────────────────────────────────────── */}
      {totalPieces > 0 && (
        <p className="mt-1 font-display text-sm text-sand-500">
          ≈ {buildTimeMin} min to build
        </p>
      )}

      {/* ── Fun message ─────────────────────────────────────────────────── */}
      {funMessage && (
        <p className="mt-2 font-display text-sm font-bold text-brick-orange">
          {funMessage}
        </p>
      )}

      {/* ── Build progress bar ──────────────────────────────────────────── */}
      {(isBuilding || buildProgress > 0) && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
              {isBuilding ? "Building…" : "Done"}
            </span>
            <span className="font-mono text-[10px] text-sand-400">
              {Math.round(buildProgress * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className="duration-base h-full rounded-full bg-brick-red transition-all"
              style={{ width: `${buildProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="my-4 h-px w-full bg-sand-300" />

      {/* ── Colour breakdown ────────────────────────────────────────────── */}
      <p className="mb-3 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
        Colour breakdown
      </p>
      <ColorBreakdown pieceCounts={pieceCounts} />

      {/* ── Export ──────────────────────────────────────────────────────── */}
      {canExport && (
        <>
          <div className="my-4 h-px w-full bg-sand-300" />

          <p className="mb-3 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
            Export
          </p>

          <div className="flex flex-col gap-2">
            {/* Download pixel-art PNG */}
            <button
              type="button"
              onClick={() => exportAsImage(matrix, renderMode, 16)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border-[1.5px] px-3 py-2",
                "font-display text-xs font-extrabold text-sand-700",
                "border-sand-300 bg-sand-200",
                "hover:bg-sand-300 active:scale-[0.97]",
                "duration-micro transition-all"
              )}
            >
              <span>↓ Download art</span>
              <Kbd className="border-sand-400/20 bg-sand-300/50 text-sand-500">E</Kbd>
            </button>

            {/* Download labeled build guide PNG */}
            <button
              type="button"
              onClick={() => exportBuildGuide(matrix, gridSize)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border-[1.5px] px-3 py-2",
                "font-display text-xs font-extrabold text-sand-700",
                "border-sand-300 bg-sand-200",
                "hover:bg-sand-300 active:scale-[0.97]",
                "duration-micro transition-all"
              )}
            >
              <span>↓ Download guide</span>
              <Kbd className="border-sand-400/20 bg-sand-300/50 text-sand-500">D</Kbd>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
