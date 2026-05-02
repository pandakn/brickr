"use client"

/**
 * StudCell
 *
 * The atomic visual unit of the brick canvas.  Renders one LEGO-coloured
 * square, optionally with a raised circular stud on top.
 *
 * Animation strategy (per AGENTS.md motion rules)
 * ────────────────────────────────────────────────
 * • Build-in  → `animate-build-in` on the outer wrapper.  The wrapper is a
 *   thin layout shell so the animation only affects opacity/scale without
 *   competing with background-colour transitions on the inner colour block.
 * • Hover pop → `hover:animate-stud-pop` on the inner colour block.
 *   Placing the two animations on separate elements prevents them from
 *   clobbering each other's CSS `animation` property.
 * • Rule: never `transition-all` on canvas cells — keyframes only.
 */

import { cn } from "@/lib/cn"
import type { LegoColor, RenderMode } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────

export interface StudCellProps {
  color: LegoColor | null
  /** Pixel size of the cell (width = height). */
  size: number
  renderMode: RenderMode
  /**
   * Milliseconds before `animate-build-in` starts playing.
   * Pass `index * 16` for progressive build reveal; pass `0` for immediate.
   */
  animationDelay: number
  onClick?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────

export function StudCell({
  color,
  size,
  renderMode,
  animationDelay,
  onClick,
}: StudCellProps) {
  // Null cell — transparent placeholder that preserves grid layout
  if (color === null) {
    return <div aria-hidden="true" style={{ width: size, height: size }} />
  }

  // Stud diameter = 60% of cell size
  const studSize = Math.round(size * 0.6)

  return (
    // Outer wrapper owns animate-build-in (avoids conflicting with hover anim)
    <div
      className="animate-build-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Inner colour block owns hover:animate-stud-pop */}
      <div
        role="button"
        tabIndex={0}
        aria-label={color.name}
        className={cn(
          "relative flex items-center justify-center",
          "rounded-stud shadow-stud",
          "cursor-pointer select-none",
          // Keyframe-only hover per AGENTS.md motion rules
          "hover:animate-stud-pop"
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: color.hex, // only inline style allowed on canvas cells
        }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        {renderMode === "stud" && (
          <div
            aria-hidden="true"
            className="pointer-events-none rounded-full border border-white/40 bg-white/25"
            style={{ width: studSize, height: studSize }}
          />
        )}
      </div>
    </div>
  )
}
