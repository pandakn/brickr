"use client"

/**
 * ControlPanel
 *
 * Floating configuration panel.
 *
 * Layout
 * ──────
 * Mobile (<lg):  full-width bottom sheet, rounded top corners, scrollable.
 * Desktop (lg+): fixed left sidebar, vertically centred.
 *
 * Contents
 * ────────
 * • Grid size picker (12 / 32 / 64)
 * • Messiness slider (0–100)
 * • Render mode toggle (Flat / Stud)
 * • Grid lines toggle
 * • Sound toggle  (Web Audio click on stud press)
 * • Estimates (pieces + minutes)
 * • Build it + Reset action buttons
 */

import { Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/cn"
import type { GridSize, RenderMode } from "@/types"
import { GridSizePicker } from "./GridSizePicker"
import { MessinessSlider } from "./MessinessSlider"

// ─── Types ────────────────────────────────────────────────────────────────

export interface ControlPanelProps {
  gridSize: GridSize
  messiness: number
  renderMode: RenderMode
  showGrid: boolean
  isBuilding: boolean
  soundEnabled: boolean
  /** True once an image has been loaded and the matrix is ready. */
  hasImage: boolean
  onGridSizeChange: (size: GridSize) => void
  onMessinessChange: (v: number) => void
  onRenderModeChange: (mode: RenderMode) => void
  onGridToggle: () => void
  onSoundToggle: () => void
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
    <p className="mb-2 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
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
  soundEnabled,
  hasImage,
  onGridSizeChange,
  onMessinessChange,
  onRenderModeChange,
  onGridToggle,
  onSoundToggle,
  onBuild,
  onReset,
}: ControlPanelProps) {
  const pieces = estimatedPieces(gridSize)
  const minutes = estimatedMinutes(gridSize)

  return (
    <div
      className={cn(
        // Shared
        "bg-sand-100/90 backdrop-blur-md",
        "border border-sand-300",
        "z-20 p-5 shadow-floating",
        "duration-base transition-all",
        // ── Mobile: full-width bottom sheet ───────────────────────────────
        "fixed right-0 bottom-0 left-0",
        "rounded-t-xl",
        "max-h-[60vh] overflow-y-auto",
        // ── Desktop: left sidebar ─────────────────────────────────────────
        "lg:right-auto lg:bottom-auto lg:left-4",
        "lg:top-1/2 lg:-translate-y-1/2",
        "lg:w-64 lg:rounded-xl",
        "lg:max-h-none lg:overflow-visible"
      )}
    >
      {/* ── Mobile drag handle ──────────────────────────────────────────── */}
      <div className="mb-3 flex justify-center lg:hidden">
        <div className="h-1 w-8 rounded-full bg-sand-400" aria-hidden="true" />
      </div>

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
        {(["flat", "stud"] as RenderMode[]).map((mode) => {
          const isActive = renderMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onRenderModeChange(mode)}
              aria-pressed={isActive}
              className={cn(
                "rounded-md border-[1.5px] px-3.5 py-1.5",
                "font-display text-xs font-extrabold",
                "duration-base cursor-pointer transition-all active:scale-[0.97]",
                isActive
                  ? "border-brick-blue bg-brick-blue text-white"
                  : "border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400"
              )}
            >
              {mode === "flat" ? "Flat" : "LEGO stud"}
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
          "w-full rounded-md border-[1.5px] px-3.5 py-2",
          "font-display text-xs font-extrabold",
          "duration-base cursor-pointer transition-all active:scale-[0.97]",
          showGrid
            ? "border-brick-blue bg-brick-blue/10 text-brick-blue"
            : "border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400"
        )}
      >
        {showGrid ? "✦ Grid lines on" : "○ Grid lines off"}
      </button>

      {/* ── Sound toggle ────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onSoundToggle}
        aria-pressed={soundEnabled}
        className={cn(
          "mt-2 flex w-full items-center gap-2 rounded-md border-[1.5px] px-3.5 py-2",
          "font-display text-xs font-extrabold",
          "duration-base cursor-pointer transition-all active:scale-[0.97]",
          soundEnabled
            ? "border-brick-blue bg-brick-blue/10 text-brick-blue"
            : "border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400"
        )}
      >
        {soundEnabled ? (
          <Volume2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        {soundEnabled ? "Sound on" : "Sound off"}
      </button>

      <Divider />

      {/* ── Estimates ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
          ~{pieces.toLocaleString()} pieces
        </span>
        <span className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
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
            "w-full font-display text-sm font-extrabold",
            "bg-brick-red text-white",
            "rounded-md px-5 py-2.5",
            "duration-micro transition-all",
            "hover:brightness-110 active:scale-[0.97]",
            "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          )}
        >
          {isBuilding ? "Building…" : "Build it ▶"}
        </button>

        {/* Secondary — Reset */}
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "w-full font-display text-sm font-extrabold",
            "bg-sand-300 text-sand-800",
            "rounded-md px-5 py-2.5",
            "hover:bg-sand-400 active:scale-[0.97]",
            "duration-micro transition-all"
          )}
        >
          Reset
        </button>
      </div>

      {/* Bottom safe-area spacer (mobile, for devices with home indicator) */}
      <div className="h-safe-b lg:hidden" />
    </div>
  )
}
