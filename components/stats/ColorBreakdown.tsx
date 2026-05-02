"use client"

/**
 * ColorBreakdown
 *
 * Renders a list of per-colour piece-count rows following the
 * "Card (color breakdown row)" pattern from DESIGN.md.
 *
 * Bar animation
 * ─────────────
 * Each bar starts at width 0 and expands to its target percentage on mount.
 * A requestAnimationFrame defers the width change by one frame so the browser
 * paints the 0% state first, then `transition-all duration-slow` carries it
 * to the final value.  (useEffect for animation timing is intentional and
 * not the "derived state" anti-pattern AGENTS.md warns against.)
 */

import { useEffect, useState } from "react"
import type { PieceCount } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────

export interface ColorBreakdownProps {
  pieceCounts: PieceCount[]
}

// ─── Component ────────────────────────────────────────────────────────────

export function ColorBreakdown({ pieceCounts }: ColorBreakdownProps) {
  const [visible, setVisible] = useState(false)

  // One rAF after mount so the bars animate in rather than snap to their
  // final width immediately.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (pieceCounts.length === 0) {
    return (
      <p className="font-display text-sm text-sand-400 italic">
        No pieces yet — upload an image to get started.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5" aria-label="Colour breakdown">
      {pieceCounts.map(({ color, count, percentage }) => (
        <li key={color.id} className="flex items-center gap-2.5">
          {/* Mini colour stud */}
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-stud"
            style={{ backgroundColor: color.hex }}
            aria-hidden="true"
          >
            <div className="h-2.5 w-2.5 rounded-full border border-white/50 bg-white/30" />
          </div>

          {/* Colour name */}
          <span className="flex-1 truncate font-display text-sm font-bold text-sand-700">
            {color.name}
          </span>

          {/* Animated fill bar */}
          <div
            className="h-2 flex-2 overflow-hidden rounded-full bg-sand-200"
            aria-hidden="true"
          >
            <div
              className="duration-slow h-full rounded-full transition-all"
              style={{
                width: visible ? `${percentage}%` : "0%",
                backgroundColor: color.hex,
              }}
            />
          </div>

          {/* Piece count */}
          <span className="min-w-8 text-right font-mono text-xs font-bold text-sand-500">
            {count}
          </span>
        </li>
      ))}
    </ul>
  )
}
