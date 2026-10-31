'use client'

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

import { BeforeAfterSlider } from '@/components/canvas/BeforeAfterSlider'
import { BrickCanvas } from '@/components/canvas/BrickCanvas'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Kbd } from '@/components/ui/kbd'
import { SparklesCore } from '@/components/ui/sparkles'
import { DropZone } from '@/components/upload/DropZone'
import { useBrickCanvas } from '@/hooks/useBrickCanvas'
import { useImageProcessor } from '@/hooks/useImageProcessor'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSound } from '@/hooks/useSound'
import { cn } from '@/lib/cn'
import { exportAsImage, exportBuildGuide } from '@/lib/exportCanvas'
import { fetchImageAsFile } from '@/lib/imageLoader'
import { computePieceCounts } from '@/lib/imageProcessor'
import type { GridDimensions } from '@/types'
import { ToyBrick } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ─── Loading placeholder ──────────────────────────────────────────────────

/**
 * Gray pulsing stud grid shown while the image processor runs.
 * Gives the user visual feedback that something is happening.
 */
function LoadingGrid({ gridDimensions }: { gridDimensions: GridDimensions }) {
  const count = gridDimensions.width * gridDimensions.height
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="animate-pulse"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridDimensions.width}, 1fr)`,
          gap: '1px',
          width: '100%',
          maxWidth: '100%',
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
  const isMobile = useIsMobile()

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

  /** URL input state */
  const [urlInput, setUrlInput] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const hasImage = canvas.state.pixelMatrix.length > 0

  // ── Derived piece counts ─────────────────────────────────────────────────
  // Always derived from the committed editable matrix, never from the
  // processor output (which goes stale as soon as a cell is toggled).
  // Empty cells are excluded by computePieceCounts, so every consumer below —
  // stats, colour breakdown, control-panel totals, build time and exports —
  // describes exactly the same pattern.
  const pieceCounts = useMemo(
    () => computePieceCounts(canvas.state.pixelMatrix),
    [canvas.state.pixelMatrix]
  )
  const totalPieces = pieceCounts.reduce((sum, count) => sum + count.count, 0)

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

  const handleGridDimensionsChange = (dims: GridDimensions) => {
    canvas.setGridDimensions(dims)
    if (sourceFileRef.current) {
      void processor.process(
        sourceFileRef.current,
        dims.width,
        dims.height,
        canvas.state.messiness
      )
    }
  }

  const handleMessinessChange = (value: number) => {
    canvas.setMessiness(value)
    if (sourceFileRef.current) {
      const dims = canvas.state.gridDimensions
      void processor.process(
        sourceFileRef.current,
        dims.width,
        dims.height,
        value
      )
    }
  }

  const handleReset = () => {
    canvas.reset()
    processor.reset()
    sourceFileRef.current = null
    setOriginalSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setShowConfetti(false)
    setShowComparison(false)
    setShowMobileStats(false)
    setUrlInput('')
    setUrlError(null)
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
    hasOriginalSrc: false,
    gridDimensions: { width: 32, height: 32 } as GridDimensions,
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
      hasOriginalSrc: !!originalSrc,
      gridDimensions: canvas.state.gridDimensions,
    }
  })

  // Registered once — reads from the always-current ref
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (
        t.isContentEditable ||
        t.tagName === 'INPUT' ||
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return

      const kb = kbRef.current
      switch (e.code) {
        case 'KeyG':
          e.preventDefault()
          kb.toggleGrid()
          break
        case 'KeyB':
          if (kb.hasImage && !kb.isBuilding) {
            e.preventDefault()
            kb.startBuild()
          }
          break
        case 'KeyR':
          e.preventDefault()
          kb.handleReset()
          break
        case 'KeyE':
          if (kb.hasImage) {
            e.preventDefault()
            exportAsImage(kb.pixelMatrix, kb.renderMode, 16)
          }
          break
        case 'KeyC':
          if (kb.hasImage && kb.hasOriginalSrc) {
            e.preventDefault()
            setShowComparison((v) => !v)
          }
          break
        case 'KeyD':
          if (kb.hasImage) {
            e.preventDefault()
            exportBuildGuide(kb.pixelMatrix, kb.gridDimensions)
          }
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setShowComparison]) // stable dep

  const handleFile = useCallback(
    (file: File) => {
      sourceFileRef.current = file
      setOriginalSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      const dims = canvas.state.gridDimensions
      void processor.process(
        file,
        dims.width,
        dims.height,
        canvas.state.messiness
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processor.process, canvas.state.gridDimensions, canvas.state.messiness]
  )

  // ── Global paste listener — detect image URLs ─────────────────────────────
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      // If an image is already loaded, don't hijack paste (maybe user is typing in a future input)
      if (hasImage || processor.isProcessing) return

      const text = e.clipboardData?.getData('text')
      if (!text) return

      // Basic URL detection
      if (text.startsWith('http') || text.startsWith('data:image')) {
        try {
          const file = await fetchImageAsFile(text)
          handleFile(file)
        } catch {
          // Silent fail for global paste — user might be pasting something else
        }
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [hasImage, processor.isProcessing, handleFile])

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput || processor.isProcessing || isLoadingUrl) return

    setIsLoadingUrl(true)
    setUrlError(null)

    try {
      const file = await fetchImageAsFile(urlInput)
      handleFile(file)
      setUrlInput('')
    } catch (err) {
      setUrlError(
        err instanceof Error
          ? err.message
          : 'Could not load image. It might be blocked by CORS.'
      )
    } finally {
      setIsLoadingUrl(false)
    }
  }

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
        <div className="flex items-center gap-1">
          <ToyBrick className="text-brick-red" />
          <span className="font-display text-xl font-black tracking-tight text-brick-red">
            Brickr
          </span>
        </div>

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
              'ml-auto flex items-center gap-2 font-display text-xs font-extrabold',
              'rounded-md border-2 px-4 py-1.5',
              'duration-micro transition-all active:scale-[0.97]',
              showComparison
                ? 'border-brick-blue bg-brick-blue text-white'
                : 'border-brick-blue bg-transparent text-brick-blue hover:bg-brick-blue/10'
            )}
          >
            <span>{showComparison ? '← Canvas' : 'Compare →'}</span>
            <Kbd
              className={cn(
                'transition-colors',
                showComparison
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-brick-blue/20 bg-brick-blue/5 text-brick-blue'
              )}
            >
              C
            </Kbd>
          </button>
        )}
      </header>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <main className="relative min-h-0 flex-1">
        {isMobile ? (
          <>
            {/* ControlPanel — mobile: Drawer bottom sheet */}
            <Drawer defaultOpen dismissible>
              <DrawerContent className="max-h-[60vh]">
                <DrawerTitle className="sr-only">Controls</DrawerTitle>
                <ControlPanel
                  gridDimensions={canvas.state.gridDimensions}
                  messiness={canvas.state.messiness}
                  renderMode={canvas.state.renderMode}
                  showGrid={canvas.state.showGrid}
                  isBuilding={canvas.state.isBuilding}
                  soundEnabled={sound.soundEnabled}
                  hasImage={hasImage}
                  totalPieces={totalPieces}
                  onGridDimensionsChange={handleGridDimensionsChange}
                  onMessinessChange={handleMessinessChange}
                  onRenderModeChange={canvas.setRenderMode}
                  onGridToggle={canvas.toggleGrid}
                  onSoundToggle={sound.toggleSound}
                  onBuild={canvas.startBuild}
                  onReset={handleReset}
                />
              </DrawerContent>
            </Drawer>

            {/* StatsPanel — mobile: Drawer bottom sheet */}
            <Drawer open={showMobileStats} onOpenChange={setShowMobileStats}>
              <DrawerContent className="max-h-[70vh]">
                <DrawerTitle className="sr-only">Stats</DrawerTitle>
                <StatsPanel
                  pieceCounts={pieceCounts}
                  isBuilding={canvas.state.isBuilding}
                  buildProgress={canvas.state.buildProgress}
                  matrix={hasImage ? canvas.state.pixelMatrix : null}
                  gridDimensions={canvas.state.gridDimensions}
                  renderMode={canvas.state.renderMode}
                />
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <>
            {/* ControlPanel — desktop: fixed sidebar */}
            <div className="fixed top-1/2 left-4 z-20 w-64 -translate-y-1/2 rounded-xl">
              <ControlPanel
                gridDimensions={canvas.state.gridDimensions}
                messiness={canvas.state.messiness}
                renderMode={canvas.state.renderMode}
                showGrid={canvas.state.showGrid}
                isBuilding={canvas.state.isBuilding}
                soundEnabled={sound.soundEnabled}
                hasImage={hasImage}
                totalPieces={totalPieces}
                onGridDimensionsChange={handleGridDimensionsChange}
                onMessinessChange={handleMessinessChange}
                onRenderModeChange={canvas.setRenderMode}
                onGridToggle={canvas.toggleGrid}
                onSoundToggle={sound.toggleSound}
                onBuild={canvas.startBuild}
                onReset={handleReset}
              />
            </div>

            {/* StatsPanel — desktop: fixed sidebar */}
            <div className="fixed top-1/2 right-4 z-20 w-56 -translate-y-1/2">
              <StatsPanel
                pieceCounts={pieceCounts}
                isBuilding={canvas.state.isBuilding}
                buildProgress={canvas.state.buildProgress}
                matrix={hasImage ? canvas.state.pixelMatrix : null}
                gridDimensions={canvas.state.gridDimensions}
                renderMode={canvas.state.renderMode}
              />
            </div>
          </>
        )}

        {/* Mobile stats toggle button — visible only on small screens */}
        {hasImage && (
          <button
            type="button"
            onClick={() => setShowMobileStats((v) => !v)}
            className={cn(
              'fixed right-4 bottom-[calc(60vh+0.75rem)] z-30 lg:hidden',
              'rounded-full px-4 py-2 shadow-floating',
              'font-display text-xs font-extrabold',
              'duration-micro transition-all active:scale-[0.97]',
              showMobileStats
                ? 'bg-brick-blue text-white'
                : 'border border-sand-300 bg-sand-100/90 text-sand-700'
            )}
          >
            Stats
          </button>
        )}

        {/* ── Canvas area ────────────────────────────────────────────────── */}
        {/* Desktop: pl-72 / pr-64 clears the fixed side panels                */}
        {/* Mobile:  no side padding; pb-[60vh] lifts content above bottom panel */}
        <div className="flex h-full items-center justify-center px-4 pb-[60vh] lg:px-0 lg:pr-64 lg:pb-0 lg:pl-72">
          {/* ── No image: drop zone ───────────────────────────────────── */}
          {!hasImage && !processor.isProcessing && (
            <div className="duration-base flex w-full max-w-xl animate-in flex-col gap-6 fade-in slide-in-from-bottom-8 zoom-in">
              {/* URL Input Section */}
              <div className="flex flex-col items-center gap-3">
                <p className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
                  — load from link —
                </p>
                <form
                  onSubmit={handleUrlSubmit}
                  className="flex w-full overflow-hidden rounded-md border border-sand-300 bg-sand-100/50 shadow-sm backdrop-blur-sm"
                >
                  <input
                    type="url"
                    placeholder="Paste an image URL here..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-transparent px-4 py-2.5 font-display text-sm text-sand-700 outline-hidden placeholder:text-sand-400"
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <button
                    type="submit"
                    disabled={
                      !urlInput || processor.isProcessing || isLoadingUrl
                    }
                    className={cn(
                      'px-6 py-2.5 font-display text-sm font-extrabold transition-all',
                      !urlInput || processor.isProcessing || isLoadingUrl
                        ? 'bg-sand-200 text-sand-400'
                        : 'bg-brick-red text-white hover:bg-brick-red/90 active:scale-[0.98]'
                    )}
                  >
                    {isLoadingUrl ? '...' : 'Load'}
                  </button>
                </form>
                {urlError && (
                  <p className="rounded-md bg-brick-red/10 px-3 py-1.5 font-display text-xs font-bold text-brick-red">
                    {urlError}
                  </p>
                )}
              </div>

              {/* DropZone Section */}
              <div className="flex flex-col items-center gap-3">
                <p className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
                  — or upload file —
                </p>
                <DropZone onFile={handleFile} />
              </div>
            </div>
          )}

          {/* ── Processing: placeholder grid ─────────────────────────── */}
          {processor.isProcessing && (
            <div className="w-full max-w-xl">
              <LoadingGrid gridDimensions={canvas.state.gridDimensions} />
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
