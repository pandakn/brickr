'use client'

import { Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { GridDimensions, RenderMode } from '@/types'
import { GridDimensionsPicker } from './GridDimensionsPicker'
import { MessinessSlider } from './MessinessSlider'
import { Kbd } from '@/components/ui/kbd'

export interface ControlPanelProps {
  gridDimensions: GridDimensions
  messiness: number
  renderMode: RenderMode
  showGrid: boolean
  isBuilding: boolean
  soundEnabled: boolean
  /** True once an image has been loaded and the matrix is ready. */
  hasImage: boolean
  onGridDimensionsChange: (dims: GridDimensions) => void
  onMessinessChange: (v: number) => void
  onRenderModeChange: (mode: RenderMode) => void
  onGridToggle: () => void
  onSoundToggle: () => void
  onBuild: () => void
  onReset: () => void
}

function estimatedPieces(dims: GridDimensions): number {
  return dims.width * dims.height
}

function estimatedMinutes(dims: GridDimensions): number {
  return Math.round((dims.width * dims.height * 15) / 60)
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="my-4 h-px w-full bg-sand-300" />
}

export function ControlPanel({
  gridDimensions,
  messiness,
  renderMode,
  showGrid,
  isBuilding,
  soundEnabled,
  hasImage,
  onGridDimensionsChange,
  onMessinessChange,
  onRenderModeChange,
  onGridToggle,
  onSoundToggle,
  onBuild,
  onReset,
}: ControlPanelProps) {
  const pieces = estimatedPieces(gridDimensions)
  const minutes = estimatedMinutes(gridDimensions)

  return (
    <div
      data-testid="control-panel"
      className={cn(
        // Shared
        'bg-sand-100/90 backdrop-blur-md',
        'border border-sand-300',
        'z-20 p-5 shadow-floating',
        'duration-base transition-all',
        'fixed right-0 bottom-0 left-0',
        'rounded-t-xl',
        'max-h-[60vh] overflow-y-auto',
        'lg:right-auto lg:bottom-auto lg:left-4',
        'lg:top-1/2 lg:-translate-y-1/2',
        'lg:w-64 lg:rounded-xl',
        'lg:max-h-none lg:overflow-visible'
      )}
    >
      <div className="mb-3 flex justify-center lg:hidden">
        <div className="h-1 w-8 rounded-full bg-sand-400" aria-hidden="true" />
      </div>

      <SectionLabel>Grid size</SectionLabel>
      <GridDimensionsPicker
        value={gridDimensions}
        onChange={onGridDimensionsChange}
      />

      <Divider />

      <MessinessSlider value={messiness} onChange={onMessinessChange} />

      <Divider />

      <SectionLabel>Render mode</SectionLabel>
      <div className="flex gap-1.5" role="group" aria-label="Render mode">
        {(['flat', 'stud'] as RenderMode[]).map((mode) => {
          const isActive = renderMode === mode
          return (
            <button
              key={mode}
              type="button"
              data-testid={`render-mode-${mode}`}
              onClick={() => onRenderModeChange(mode)}
              aria-pressed={isActive}
              className={cn(
                'rounded-md border-[1.5px] px-3.5 py-1.5',
                'font-display text-xs font-extrabold',
                'duration-base cursor-pointer transition-all active:scale-[0.97]',
                isActive
                  ? 'border-brick-blue bg-brick-blue text-white'
                  : 'border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400'
              )}
            >
              {mode === 'flat' ? 'Flat' : 'LEGO stud'}
            </button>
          )
        })}
      </div>

      <Divider />

      <button
        type="button"
        data-testid="grid-toggle"
        onClick={onGridToggle}
        aria-pressed={showGrid}
        className={cn(
          'flex w-full items-center justify-between rounded-md border-[1.5px] px-3.5 py-2',
          'font-display text-xs font-extrabold',
          'duration-base cursor-pointer transition-all active:scale-[0.97]',
          showGrid
            ? 'border-brick-blue bg-brick-blue/10 text-brick-blue'
            : 'border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400'
        )}
      >
        <span>{showGrid ? '✦ Grid lines on' : '○ Grid lines off'}</span>
        <Kbd
          className={cn(
            'transition-colors',
            showGrid
              ? 'border-brick-blue/20 bg-brick-blue/5 text-brick-blue'
              : 'border-sand-400/20 bg-sand-300/50 text-sand-500'
          )}
        >
          G
        </Kbd>
      </button>

      <button
        type="button"
        data-testid="sound-toggle"
        onClick={onSoundToggle}
        aria-pressed={soundEnabled}
        className={cn(
          'mt-2 flex w-full items-center gap-2 rounded-md border-[1.5px] px-3.5 py-2',
          'font-display text-xs font-extrabold',
          'duration-base cursor-pointer transition-all active:scale-[0.97]',
          soundEnabled
            ? 'border-brick-blue bg-brick-blue/10 text-brick-blue'
            : 'border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400'
        )}
      >
        {soundEnabled ? (
          <Volume2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        {soundEnabled ? 'Sound on' : 'Sound off'}
      </button>

      <Divider />

      <div className="flex items-center justify-between">
        <span
          data-testid="pieces-estimate"
          className="font-mono text-[10px] tracking-widest text-sand-400 uppercase"
        >
          ~{pieces.toLocaleString()} pieces
        </span>
        <span
          data-testid="minutes-estimate"
          className="font-mono text-[10px] tracking-widest text-sand-400 uppercase"
        >
          ~{minutes} min
        </span>
      </div>

      <Divider />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          data-testid="build-button"
          onClick={onBuild}
          disabled={!hasImage || isBuilding}
          className={cn(
            'group flex w-full items-center justify-between font-display text-sm font-extrabold',
            'bg-brick-red text-white',
            'rounded-md px-5 py-2.5',
            'duration-micro transition-all',
            'hover:brightness-110 active:scale-[0.97]',
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'
          )}
        >
          <span>{isBuilding ? 'Building…' : 'Build it ▶'}</span>
          {!isBuilding && hasImage && (
            <Kbd className="border-white/20 bg-white/10 text-white">B</Kbd>
          )}
        </button>

        <button
          type="button"
          data-testid="reset-button"
          onClick={onReset}
          className={cn(
            'flex items-center justify-between font-display text-sm font-extrabold',
            'bg-sand-300 text-sand-800',
            'rounded-md px-5 py-2.5',
            'hover:bg-sand-400 active:scale-[0.97]',
            'duration-micro transition-all'
          )}
        >
          <span>Reset</span>
          <Kbd className="border-sand-800/10 bg-sand-800/5 text-sand-800">
            R
          </Kbd>
        </button>
      </div>

      {/* Bottom safe-area spacer (mobile, for devices with home indicator) */}
      <div className="h-safe-b lg:hidden" />
    </div>
  )
}
