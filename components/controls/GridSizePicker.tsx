'use client'

import { cn } from '@/lib/cn'
import type { GridSize } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────

export interface GridSizePickerProps {
  value: GridSize
  onChange: (size: GridSize) => void
}

// ─── Constants ────────────────────────────────────────────────────────────

const SIZES: { value: GridSize; label: string }[] = [
  { value: 12, label: '12×12' },
  { value: 32, label: '32×32' },
  { value: 64, label: '64×64' },
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
    <div className="flex gap-1.5" role="group" aria-label="Grid size">
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
              'border-[1.5px] px-3.5 py-1.5 rounded-md',
              'font-display font-extrabold text-xs',
              'cursor-pointer transition-all duration-base',
              'active:scale-[0.97]',
              // State
              isActive
                ? 'bg-brick-blue text-white border-brick-blue'
                : 'bg-sand-200 text-sand-600 border-sand-300 hover:border-sand-400',
            )}
          >
            {size.label}
          </button>
        )
      })}
    </div>
  )
}
