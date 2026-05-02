'use client'

/**
 * ControlPanel
 *
 * Floating left panel containing all canvas configuration controls.
 * Layout follows the DESIGN.md "Floating panel" pattern.
 *
 * Responsibilities (dumb panel — all logic lives in useBrickCanvas)
 * ─────────────────────────────────────────────────────────────────
 * • Grid size picker (12 / 32 / 64)
 * • Messiness slider (0–100)
 * • Render mode toggle (Flat / Stud)
 * • Grid lines toggle
 * • Build it + Reset buttons
 * • Estimated piece count and build time
 */

import { cn } from '@/lib/cn'
import type { GridSize, RenderMode } from '@/types'
import { GridSizePicker } from './GridSizePicker'
import { MessinessSlider } from './MessinessSlider'

// ─── Types ────────────────────────────────────────────────────────────────

export interface ControlPanelProps {
  gridSize: GridSize
  messiness: number
  renderMode: RenderMode
  showGrid: boolean
  isBuilding: boolean
  /** True once an image has been loaded and the matrix is ready. */
  hasImage: boolean
  onGridSizeChange: (size: GridSize) => void
  onMessinessChange: (v: number) => void
  onRenderModeChange: (mode: RenderMode) => void
  onGridToggle: () => void
  onBuild: () => void
  onReset: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function estimatedPieces(gridSize: GridSize): number {
  return gridSize * gridSize
}

function estimatedMinutes(gridSize: GridSize): number {
  return Math.round((gridSize * gridSize * 15) / 60)
}

// ─── Sub-components ───────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-sand-400">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-4 h-px w-full bg-sand-300" />
}

// ─── Component ────────────────────────────────────────────────────────────

export function ControlPanel({
  gridSize,
  messiness,
  renderMode,
  showGrid,
  isBuilding,
  hasImage,
  onGridSizeChange,
  onMessinessChange,
  onRenderModeChange,
  onGridToggle,
  onBuild,
  onReset,
}: ControlPanelProps) {
  const pieces = estimatedPieces(gridSize)
  const minutes = estimatedMinutes(gridSize)

  return (
    <div
      className={cn(
        // Floating panel — from DESIGN.md
        'fixed left-4 top-1/2 z-20 -translate-y-1/2',
        'w-64',
        'bg-sand-100/90 backdrop-blur-md',
        'border border-sand-300',
        'rounded-xl shadow-floating',
        'p-5',
        // Panel controls transition
        'transition-all duration-base',
      )}
    >
      {/* ── Grid size ───────────────────────────────────────────────────── */}
      <SectionLabel>Grid size</SectionLabel>
      <GridSizePicker value={gridSize} onChange={onGridSizeChange} />

      <Divider />

      {/* ── Messiness ───────────────────────────────────────────────────── */}
      <MessinessSlider value={messiness} onChange={onMessinessChange} />

      <Divider />

      {/* ── Render mode ─────────────────────────────────────────────────── */}
      <SectionLabel>Render mode</SectionLabel>
      <div className="flex gap-1.5" role="group" aria-label="Render mode">
        {(['flat', 'stud'] as RenderMode[]).map((mode) => {
          const isActive = renderMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onRenderModeChange(mode)}
              aria-pressed={isActive}
              className={cn(
                'border-[1.5px] px-3.5 py-1.5 rounded-md',
                'font-display font-extrabold text-xs',
                'cursor-pointer transition-all duration-base active:scale-[0.97]',
                isActive
                  ? 'bg-brick-blue text-white border-brick-blue'
                  : 'bg-sand-200 text-sand-600 border-sand-300 hover:border-sand-400',
              )}
            >
              {mode === 'flat' ? 'Flat' : 'LEGO stud'}
            </button>
          )
        })}
      </div>

      <Divider />

      {/* ── Grid lines toggle ───────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onGridToggle}
        aria-pressed={showGrid}
        className={cn(
          'w-full border-[1.5px] px-3.5 py-2 rounded-md',
          'font-display font-extrabold text-xs',
          'cursor-pointer transition-all duration-base active:scale-[0.97]',
          showGrid
            ? 'bg-brick-blue/10 text-brick-blue border-brick-blue'
            : 'bg-sand-200 text-sand-600 border-sand-300 hover:border-sand-400',
        )}
      >
        {showGrid ? '✦ Grid lines on' : '○ Grid lines off'}
      </button>

      <Divider />

      {/* ── Estimates ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-sand-400">
          ~{pieces.toLocaleString()} pieces
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-sand-400">
          ~{minutes} min
        </span>
      </div>

      <Divider />

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Primary — Build it */}
        <button
          type="button"
          onClick={onBuild}
          disabled={!hasImage || isBuilding}
          className={cn(
            'w-full font-display font-extrabold text-sm',
            'bg-brick-red text-white',
            'px-5 py-2.5 rounded-md',
            'transition-all duration-micro',
            'hover:brightness-110 active:scale-[0.97]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          )}
        >
          {isBuilding ? 'Building…' : 'Build it ▶'}
        </button>

        {/* Secondary — Reset */}
        <button
          type="button"
          onClick={onReset}
          className={cn(
            'w-full font-display font-extrabold text-sm',
            'bg-sand-300 text-sand-800',
            'px-5 py-2.5 rounded-md',
            'hover:bg-sand-400 active:scale-[0.97]',
            'transition-all duration-micro',
          )}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
