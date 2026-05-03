'use client'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/cn'

export interface MessinessSliderProps {
  value: number // 0–100
  onChange: (v: number) => void
}

export function MessinessSlider({ value, onChange }: MessinessSliderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-sand-700">
          Messiness
        </span>
        <span className="font-mono text-xs font-bold text-sand-500">
          {value}%
        </span>
      </div>

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
          '**:data-[slot=slider-track]:bg-sand-200',
          '**:data-[slot=slider-range]:bg-brick-orange'
        )}
      />

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
