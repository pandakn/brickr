'use client'

import { cn } from '@/lib/cn'
import type { GridDimension, GridDimensions } from '@/types'

export interface GridDimensionsPickerProps {
  value: GridDimensions
  onChange: (dims: GridDimensions) => void
}

const SIZES: GridDimension[] = [12, 25, 32, 40, 64]

function AxisRow({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: GridDimension
  onSelect: (v: GridDimension) => void
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[9px] tracking-widest text-sand-400 uppercase">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {SIZES.map((size) => {
          const isActive = selected === size
          return (
            <button
              key={size}
              type="button"
              data-testid={`grid-${label.toLowerCase()}-${size}`}
              onClick={() => onSelect(size)}
              aria-pressed={isActive}
              className={cn(
                'rounded-md border-[1.5px] px-3 py-1',
                'font-display text-xs font-extrabold',
                'duration-base cursor-pointer transition-all',
                'active:scale-[0.97]',
                isActive
                  ? 'border-brick-blue bg-brick-blue text-white'
                  : 'border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400'
              )}
            >
              {size}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function GridDimensionsPicker({
  value,
  onChange,
}: GridDimensionsPickerProps) {
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Grid size">
      {/* Square presets for quick selection */}
      <div className="flex flex-wrap gap-1.5">
        {SIZES.map((size) => {
          const isActive = value.width === size && value.height === size
          return (
            <button
              key={`sq-${size}`}
              type="button"
              data-testid={`grid-size-${size}`}
              onClick={() => onChange({ width: size, height: size })}
              aria-pressed={isActive}
              className={cn(
                'rounded-md border-[1.5px] px-3.5 py-1.5',
                'font-display text-xs font-extrabold',
                'duration-base cursor-pointer transition-all',
                'active:scale-[0.97]',
                isActive
                  ? 'border-brick-blue bg-brick-blue text-white'
                  : 'border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400'
              )}
            >
              {size}x{size}
            </button>
          )
        })}
      </div>

      {/* Independent width / height */}
      <AxisRow
        label="Width"
        selected={value.width}
        onSelect={(w) => onChange({ ...value, width: w })}
      />
      <AxisRow
        label="Height"
        selected={value.height}
        onSelect={(h) => onChange({ ...value, height: h })}
      />
    </div>
  )
}
