'use client'

import { cn } from '@/lib/cn'
import type { LegoColor, RenderMode } from '@/types'
import type { KeyboardEvent } from 'react'

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

/**
 * A `<div role="button">` gets no free keyboard activation, so Enter/Space
 * have to be translated into clicks by hand. Space also needs preventDefault
 * to stop the page from scrolling.
 */
function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

export function StudCell({
  color,
  size,
  renderMode,
  animationDelay,
  onClick,
}: StudCellProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!isActivationKey(event.key)) return
    event.preventDefault()
    onClick?.()
  }

  // Null cell — a removed brick. It keeps the exact footprint of a placed
  // brick (no grid reflow, canvas sizing untouched) and is rendered as an
  // empty dashed slot rather than a fake brick.
  if (color === null) {
    // Without a handler there is nothing to activate, so stay decorative.
    if (!onClick) {
      return (
        <div
          data-testid="stud-cell-empty"
          aria-hidden="true"
          style={{ width: size, height: size }}
        />
      )
    }

    return (
      <div
        data-testid="stud-cell-empty"
        role="button"
        tabIndex={0}
        aria-label="Empty position"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-center',
          'rounded-stud border border-dashed border-sand-400 bg-sand-200/40',
          'cursor-pointer select-none',
          // Keyframe-free hover (colour only) — no transitions on cells
          'hover:border-brick-blue hover:bg-sand-300',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brick-blue'
        )}
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
        onKeyDown={handleKeyDown}
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
