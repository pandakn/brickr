'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/cn'

export interface BeforeAfterSliderProps {
  /** Object URL (or any valid src) of the original uploaded image. */
  originalSrc: string
  /** The fully-rendered BrickCanvas element shown on the right side. */
  legoCanvas: React.ReactNode
  className?: string
}

export function BeforeAfterSlider({
  originalSrc,
  legoCanvas,
  className,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  /** 0–100: percentage of the container that shows the original image. */
  const [splitPct, setSplitPct] = useState(50)
  const isDragging = useRef(false)

  const updateSplit = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clientX - rect.left
    setSplitPct(Math.max(2, Math.min(98, (x / rect.width) * 100)))
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDragging.current = true
      // Capture keeps events flowing even when pointer leaves the element
      e.currentTarget.setPointerCapture(e.pointerId)
      updateSplit(e.clientX)
    },
    [updateSplit]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return
      updateSplit(e.clientX)
    },
    [updateSplit]
  )

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-full w-full overflow-hidden rounded-xl select-none',
        'cursor-col-resize touch-none',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── LEGO canvas — full size, base layer ──────────────────────── */}
      <div className="pointer-events-none absolute inset-0">{legoCanvas}</div>

      {/* ── Original image — full size, clipped on the right ─────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
      >
        <img
          data-testid="before-after-original"
          src={originalSrc}
          alt="Original image"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* ── Divider line ─────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-floating"
        style={{ left: `${splitPct}%`, transform: 'translateX(-50%)' }}
      >
        {/* Drag handle circle — centred on the divider */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'flex h-9 w-9 items-center justify-center',
            'rounded-full bg-white shadow-floating'
          )}
          aria-hidden="true"
        >
          {/* Two parallel vertical bars — the classic drag affordance */}
          <div className="flex gap-1">
            <div className="h-4 w-0.5 rounded-full bg-sand-400" />
            <div className="h-4 w-0.5 rounded-full bg-sand-400" />
          </div>
        </div>
      </div>

      {/* ── Corner labels ─────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute top-3 left-3 z-10">
        <span
          data-testid="label-original"
          className="rounded-sm bg-black/30 px-2 py-0.5 font-mono text-[10px] tracking-widest text-white/80 uppercase"
        >
          Original
        </span>
      </div>
      <div className="pointer-events-none absolute top-3 right-3 z-10">
        <span
          data-testid="label-lego"
          className="rounded-sm bg-black/30 px-2 py-0.5 font-mono text-[10px] tracking-widest text-white/80 uppercase"
        >
          LEGO
        </span>
      </div>
    </div>
  )
}
