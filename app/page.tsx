"use client"

/**
 * Brickr — main page
 *
 * Orchestrates useBrickCanvas + useImageProcessor and renders the full
 * 3-panel layout:  ControlPanel | canvas area | StatsPanel
 *
 * State flow
 * ──────────
 * 1. No image → DropZone fills the canvas area.
 * 2. File dropped → auto-process (resize + quantise + messiness).
 * 3. Processing done → matrix synced into canvas state via loadImage.
 * 4. "Build it" → startBuild() kicks off the rAF progress animation.
 * 5. Build complete → SparklesCore confetti fires for 3 s.
 *
 * Panel widths (fixed positioning):
 *   ControlPanel  left-4  w-64 → 256 + 16 = 272 px from left edge
 *   StatsPanel    right-4 w-56 → 224 + 16 = 240 px from right edge
 * Canvas area uses pl-72 (288 px) / pr-64 (256 px) so content never
 * slides under either panel.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useBrickCanvas } from "@/hooks/useBrickCanvas"
import { useImageProcessor } from "@/hooks/useImageProcessor"
import { useSound } from "@/hooks/useSound"
import { DropZone } from "@/components/upload/DropZone"
import { BrickCanvas } from "@/components/canvas/BrickCanvas"
import { BeforeAfterSlider } from "@/components/canvas/BeforeAfterSlider"
import { ControlPanel } from "@/components/controls/ControlPanel"
import { StatsPanel } from "@/components/stats/StatsPanel"
import { SparklesCore } from "@/components/ui/sparkles"
import { cn } from "@/lib/cn"
import { exportAsImage } from "@/lib/exportCanvas"
import type { GridSize } from "@/types"

// ─── Loading placeholder ──────────────────────────────────────────────────

/**
 * Gray pulsing stud grid shown while the image processor runs.
 * Gives the user visual feedback that something is happening.
 */
function LoadingGrid({ gridSize }: { gridSize: GridSize }) {
  const count = gridSize * gridSize
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="animate-pulse"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: "1px",
          aspectRatio: "1 / 1",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-stud bg-sand-300" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function Page() {
  const canvas = useBrickCanvas()
  const processor = useImageProcessor()
  const sound = useSound()

  /** The last file the user uploaded — kept so we can reprocess on settings change. */
  const sourceFileRef = useRef<File | null>(null)

  /** Object URL for the original image, used in the BeforeAfterSlider. */
  const [originalSrc, setOriginalSrc] = useState<string | null>(null)

  /** Controls the sparkles confetti overlay shown after a completed build. */
  const [showConfetti, setShowConfetti] = useState(false)

  /** When true the canvas area shows BeforeAfterSlider instead of BrickCanvas. */
  const [showComparison, setShowComparison] = useState(false)

  /** Controls the mobile StatsPanel bottom-sheet visibility. */
  const [showMobileStats, setShowMobileStats] = useState(false)

  const hasImage = canvas.state.pixelMatrix.length > 0

  // ── Sync processor output → canvas state ─────────────────────────────────
  // Called every time the processor finishes a new matrix (initial load,
  // or reprocess after gridSize / messiness change).
  useEffect(() => {
    if (processor.matrix && processor.imageData) {
      canvas.loadImage(processor.matrix, processor.imageData)
    }
    // canvas.loadImage is stable (useCallback []) — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processor.matrix, processor.imageData])

  // ── Settings change + reset handlers ──────────────────────────────────────
  // Defined BEFORE the keyboard-shortcut block so kbRef can reference handleReset.

  const handleGridSizeChange = (size: GridSize) => {
    canvas.setGridSize(size)
    if (sourceFileRef.current) {
      void processor.process(
        sourceFileRef.current,
        size,
        canvas.state.messiness
      )
    }
  }

  const handleMessinessChange = (value: number) => {
    canvas.setMessiness(value)
    if (sourceFileRef.current) {
      void processor.process(
        sourceFileRef.current,
        canvas.state.gridSize,
        value
      )
    }
  }

  const handleReset = () => {
    canvas.reset()
    sourceFileRef.current = null
    setOriginalSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setShowConfetti(false)
    setShowComparison(false)
    setShowMobileStats(false)
  }

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  // Uses the "stable callback ref" pattern: a no-deps useEffect writes current
  // values into a ref after every render; a once-only useEffect reads from the
  // ref so the event listener is registered only once (no stale closures).
  const kbRef = useRef({
    toggleGrid: canvas.toggleGrid,
    startBuild: canvas.startBuild,
    handleReset: () => {},
    isBuilding: canvas.state.isBuilding,
    hasImage: false,
    pixelMatrix: canvas.state.pixelMatrix,
    renderMode: canvas.state.renderMode,
  })

  // Runs after every render — safe to write to ref here (not during render)
  useEffect(() => {
    kbRef.current = {
      toggleGrid: canvas.toggleGrid,
      startBuild: canvas.startBuild,
      handleReset,
      isBuilding: canvas.state.isBuilding,
      hasImage,
      pixelMatrix: canvas.state.pixelMatrix,
      renderMode: canvas.state.renderMode,
    }
  })

  // Registered once — reads from the always-current ref
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (
        t.isContentEditable ||
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return

      const kb = kbRef.current
      switch (e.key.toLowerCase()) {
        case "g":
          e.preventDefault()
          kb.toggleGrid()
          break
        case "b":
          e.preventDefault()
          if (kb.hasImage && !kb.isBuilding) kb.startBuild()
          break
        case "r":
          e.preventDefault()
          kb.handleReset()
          break
        case "e":
          e.preventDefault()
          if (kb.hasImage) exportAsImage(kb.pixelMatrix, kb.renderMode, 16)
          break
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, []) // empty deps — listener registered once, values read via ref

  // ── Confetti on build complete ────────────────────────────────────────────
  // Use rAF to defer the setState call out of the synchronous effect body,
  // avoiding the "cascading renders" lint rule.
  useEffect(() => {
    if (
      !canvas.state.isBuilding &&
      canvas.state.buildProgress === 1 &&
      hasImage
    ) {
      const rafId = requestAnimationFrame(() => setShowConfetti(true))
      const timer = window.setTimeout(() => setShowConfetti(false), 3000)
      return () => {
        cancelAnimationFrame(rafId)
        window.clearTimeout(timer)
      }
    }
  }, [canvas.state.isBuilding, canvas.state.buildProgress, hasImage])

  // ── File handler ──────────────────────────────────────────────────────────

  const handleFile = useCallback(
    (file: File) => {
      sourceFileRef.current = file
      setOriginalSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      void processor.process(
        file,
        canvas.state.gridSize,
        canvas.state.messiness
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processor.process, canvas.state.gridSize, canvas.state.messiness]
  )

  // ── Cell click with sound ─────────────────────────────────────────────────
  // Destructure stable callbacks so the useCallback dep array is precise.
  const { playClick } = sound
  const { handleCellClick: canvasHandleCell } = canvas

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      playClick()
      canvasHandleCell(row, col)
    },
    [playClick, canvasHandleCell]
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sand-100">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center border-b border-sand-300 px-6">
        <span className="font-display text-xl font-black tracking-tight text-sand-800">
          Brickr
        </span>
        <span className="ml-2 font-mono text-xs text-sand-500">
          image → LEGO
        </span>

        {/* Error banner (processing failure) */}
        {processor.error && (
          <span className="ml-4 rounded-md bg-brick-red/10 px-3 py-1 font-display text-xs font-bold text-brick-red">
            {processor.error}
          </span>
        )}

        {/* Compare toggle — only when an image is loaded */}
        {hasImage && originalSrc && (
          <button
            type="button"
            onClick={() => setShowComparison((v) => !v)}
            className={cn(
              "ml-auto font-display text-xs font-extrabold",
              "rounded-md border-2 px-4 py-1.5",
              "duration-micro transition-all active:scale-[0.97]",
              showComparison
                ? "border-brick-blue bg-brick-blue text-white"
                : "border-brick-blue bg-transparent text-brick-blue hover:bg-brick-blue/10"
            )}
          >
            {showComparison ? "← Canvas" : "Compare →"}
          </button>
        )}
      </header>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <main className="relative min-h-0 flex-1">
        {/* Floating panels (position: fixed — don't affect flow) */}
        <ControlPanel
          gridSize={canvas.state.gridSize}
          messiness={canvas.state.messiness}
          renderMode={canvas.state.renderMode}
          showGrid={canvas.state.showGrid}
          isBuilding={canvas.state.isBuilding}
          soundEnabled={sound.soundEnabled}
          hasImage={hasImage}
          onGridSizeChange={handleGridSizeChange}
          onMessinessChange={handleMessinessChange}
          onRenderModeChange={canvas.setRenderMode}
          onGridToggle={canvas.toggleGrid}
          onSoundToggle={sound.toggleSound}
          onBuild={canvas.startBuild}
          onReset={handleReset}
        />

        <StatsPanel
          pieceCounts={processor.pieceCounts}
          isBuilding={canvas.state.isBuilding}
          buildProgress={canvas.state.buildProgress}
          matrix={hasImage ? canvas.state.pixelMatrix : null}
          gridSize={canvas.state.gridSize}
          renderMode={canvas.state.renderMode}
          mobileVisible={showMobileStats}
        />

        {/* Mobile stats toggle button — visible only on small screens */}
        {hasImage && (
          <button
            type="button"
            onClick={() => setShowMobileStats((v) => !v)}
            className={cn(
              "fixed right-4 bottom-[calc(60vh+0.75rem)] z-30 lg:hidden",
              "rounded-full px-4 py-2 shadow-floating",
              "font-display text-xs font-extrabold",
              "duration-micro transition-all active:scale-[0.97]",
              showMobileStats
                ? "bg-brick-blue text-white"
                : "border border-sand-300 bg-sand-100/90 text-sand-700"
            )}
          >
            {showMobileStats ? "✕ Stats" : "📊 Stats"}
          </button>
        )}

        {/* ── Canvas area ────────────────────────────────────────────────── */}
        {/* Desktop: pl-72 / pr-64 clears the fixed side panels                */}
        {/* Mobile:  no side padding; pb-[60vh] lifts content above bottom panel */}
        <div className="flex h-full items-center justify-center px-4 pb-[60vh] lg:px-0 lg:pr-64 lg:pb-0 lg:pl-72">
          {/* ── No image: drop zone ───────────────────────────────────── */}
          {!hasImage && !processor.isProcessing && (
            <div className="w-full max-w-xl">
              <DropZone onFile={handleFile} />
            </div>
          )}

          {/* ── Processing: placeholder grid ─────────────────────────── */}
          {processor.isProcessing && (
            <div className="w-full max-w-xl">
              <LoadingGrid gridSize={canvas.state.gridSize} />
            </div>
          )}

          {/* ── Image loaded: brick canvas or before/after ────────────── */}
          {hasImage && !processor.isProcessing && (
            <div className="relative flex h-full w-full items-center justify-center">
              {/* Completion confetti overlay */}
              {showConfetti && (
                <div className="pointer-events-none absolute inset-0 z-30">
                  <SparklesCore
                    background="transparent"
                    particleColor="#E3000B"
                    particleDensity={60}
                    speed={2}
                    minSize={2}
                    maxSize={5}
                    className="h-full w-full"
                  />
                </div>
              )}

              {/* Before/after comparison slider */}
              {showComparison && originalSrc ? (
                <BeforeAfterSlider
                  originalSrc={originalSrc}
                  legoCanvas={
                    <BrickCanvas
                      matrix={canvas.state.pixelMatrix}
                      renderMode={canvas.state.renderMode}
                      showGrid={canvas.state.showGrid}
                      cellSize={16}
                      isBuilding={canvas.state.isBuilding}
                      buildKey={canvas.buildKey}
                      onCellClick={handleCellClick}
                    />
                  }
                  className="h-full max-h-[calc(100vh-4rem)] w-full"
                />
              ) : (
                <BrickCanvas
                  matrix={canvas.state.pixelMatrix}
                  renderMode={canvas.state.renderMode}
                  showGrid={canvas.state.showGrid}
                  cellSize={16}
                  isBuilding={canvas.state.isBuilding}
                  buildKey={canvas.buildKey}
                  onCellClick={handleCellClick}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
