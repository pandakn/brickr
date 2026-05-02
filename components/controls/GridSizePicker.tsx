"use client"

import { cn } from "@/lib/cn"
import type { GridSize } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────

export interface GridSizePickerProps {
  value: GridSize
  onChange: (size: GridSize) => void
}

// ─── Constants ────────────────────────────────────────────────────────────

const SIZES: { value: GridSize; label: string }[] = [
  { value: 12, label: "12×12" },
  { value: 25, label: "25×25" },
  { value: 32, label: "32×32" },
  { value: 40, label: "40×40" },
  { value: 64, label: "64×64" },
]

// ─── Component ────────────────────────────────────────────────────────────

/**
 * GridSizePicker
 *
 * Three pill-style toggle buttons for selecting the canvas resolution.
 * Follows the "Grid size pill (toggle group)" pattern from DESIGN.md.
 */
export function GridSizePicker({ value, onChange }: GridSizePickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grid size">
      {SIZES.map((size) => {
        const isActive = value === size.value
        return (
          <button
            key={size.value}
            type="button"
            onClick={() => onChange(size.value)}
            aria-pressed={isActive}
            className={cn(
              // Base — from DESIGN.md grid pill pattern
              "rounded-md border-[1.5px] px-3.5 py-1.5",
              "font-display text-xs font-extrabold",
              "duration-base cursor-pointer transition-all",
              "active:scale-[0.97]",
              // State
              isActive
                ? "border-brick-blue bg-brick-blue text-white"
                : "border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400"
            )}
          >
            {size.label}
          </button>
        )
      })}
    </div>
  )
}
