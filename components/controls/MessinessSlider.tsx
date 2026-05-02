"use client"

/**
 * MessinessSlider
 *
 * Controls the amount of random palette-index variation applied to the pixel
 * matrix (0 = clean match, 100 = ~30 % of cells swapped with adjacent colours).
 *
 * Uses the shadcn Slider primitive.  The track and range fill colours are
 * overridden via Tailwind's descendant selector utilities so they follow the
 * Brickr palette (sand-200 track, brick-orange fill) instead of the shadcn
 * semantic defaults.
 */

import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/cn"

// ─── Types ────────────────────────────────────────────────────────────────

export interface MessinessSliderProps {
  value: number // 0–100
  onChange: (v: number) => void
}

// ─── Component ────────────────────────────────────────────────────────────

export function MessinessSlider({ value, onChange }: MessinessSliderProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-sand-700">
          Messiness
        </span>
        <span className="font-mono text-xs font-bold text-sand-500">
          {value}%
        </span>
      </div>

      {/* shadcn Slider — track overridden to sand-200, range to brick-orange */}
      <Slider
        value={[value]}
        onValueChange={(vals) => {
          const v = vals[0]
          if (v !== undefined) onChange(v)
        }}
        min={0}
        max={100}
        step={1}
        aria-label="Messiness"
        className={cn(
          // Override track colour (Tailwind v4 descendant variant)
          "**:data-[slot=slider-track]:bg-sand-200",
          // Override active range fill colour
          "**:data-[slot=slider-range]:bg-brick-orange"
        )}
      />

      {/* Axis labels */}
      <div className="flex justify-between">
        <span className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
          Clean
        </span>
        <span className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
          Chaotic
        </span>
      </div>
    </div>
  )
}
