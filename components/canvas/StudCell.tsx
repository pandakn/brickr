'use client'

import { cn } from '@/lib/cn'
import type { LegoColor, RenderMode } from '@/types'

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

export function StudCell({
  color,
  size,
  renderMode,
  animationDelay,
  onClick,
}: StudCellProps) {
  // Null cell — transparent placeholder that preserves grid layout
  if (color === null) {
    return (
      <div
        data-testid="stud-cell-empty"
        aria-hidden="true"
        style={{ width: size, height: size }}
      />
    )
  }

  // Stud diameter = 60% of cell size
  const studSize = Math.round(size * 0.6)

  return (
    // Outer wrapper owns animate-build-in (avoids conflicting with hover anim)
    <div
      data-testid="stud-cell"
      className="animate-build-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Inner colour block owns hover:animate-stud-pop */}
      <div
        role="button"
        tabIndex={0}
        aria-label={color.name}
        className={cn(
          'relative flex items-center justify-center',
          'rounded-stud shadow-stud',
          'cursor-pointer select-none',
          // Keyframe-only hover per AGENTS.md motion rules
          'hover:animate-stud-pop'
        )}
        style={{
          width: size,
          height: size,
          backgroundColor: color.hex, // only inline style allowed on canvas cells
        }}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        {renderMode === 'stud' && (
          <div
            data-testid="stud"
            aria-hidden="true"
            className="pointer-events-none rounded-full border border-white/40 bg-white/25"
            style={{ width: studSize, height: studSize }}
          />
        )}
      </div>
    </div>
  )
}
