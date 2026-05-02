# Brickr — AGENTS.md

> AI working instructions for the Brickr project.
> Read this file before writing any code, component, or config.

---

## Project overview

Brickr converts images into LEGO-style pixel art in the browser. It is a single-page creative playground — no auth, no dashboard, no SaaS patterns. The experience should feel like playing with a physical toy, not using software.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Static Export) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Motion/FX | Aceternity UI |
| State | React hooks + Zustand |
| Image processing | Canvas API (browser-side only) |

---

## Project structure

```
src/
  app/
    layout.tsx          # Root layout, font imports
    page.tsx            # Single page — the entire app
  components/
    canvas/
      BrickCanvas.tsx   # Core LEGO canvas renderer
      StudCell.tsx      # Individual stud cell
    controls/
      ControlPanel.tsx  # Floating left/bottom panel
      GridSizePicker.tsx
      MessinessSlider.tsx
    stats/
      StatsPanel.tsx    # Floating right panel
      ColorBreakdown.tsx
      PieceCount.tsx
    upload/
      DropZone.tsx      # Image upload area
    shared/
      Badge.tsx
      Button.tsx
  lib/
    colorMapping.ts     # LAB color space + LEGO palette
    imageProcessor.ts   # Canvas resize + quantization
    legoColors.ts       # LEGO color palette definitions
    buildGuide.ts       # Instruction grid generator
  hooks/
    useBrickCanvas.ts   # Main canvas state
    useImageProcessor.ts
  types/
    index.ts            # All shared types
```

---

## Coding conventions

### General
- Strict TypeScript — no `any`, no `as unknown`
- Named exports everywhere — no default exports except `page.tsx` and `layout.tsx`
- Co-locate component types with the component file
- No barrel `index.ts` re-exports unless there are 4+ files in a folder

### Components
- Functional components only
- Props interface named `[ComponentName]Props`
- Keep components under 150 lines — extract if longer
- Client components get `'use client'` at the top; default to Server Components
- Aceternity components go in `components/ui/` (same as shadcn)

### Tailwind
- Use design tokens from `DESIGN.md` — no arbitrary values unless unavoidable
- Follow the class order: layout → spacing → sizing → typography → color → border → effects → motion
- Extract repeated class combos into `cn()` variants or a shared component, not `@apply`

### Canvas / image processing
- All image processing runs client-side via Canvas API — never send image data to a server
- `imageProcessor.ts` handles resize → quantize → matrix output
- `colorMapping.ts` handles LAB delta-E matching to the LEGO palette
- The pixel matrix is the single source of truth — canvas renders from it

### State shape
```ts
type BrickState = {
  originalImage: ImageData | null
  pixelMatrix: LegoColor[][]  // [row][col]
  gridSize: 12 | 32 | 64
  messiness: number           // 0–100
  renderMode: 'flat' | 'stud'
  showGrid: boolean
  isBuilding: boolean
  buildProgress: number       // 0–1
}
```

---

## Do not do

- No login, auth, or user accounts
- No API routes — everything is browser-side
- No external image CDN or uploads to a server
- No Zustand / Jotai unless state genuinely outgrows hooks
- No `useEffect` for derived state — compute it inline or with `useMemo`
- No hardcoded hex colors in components — use Tailwind tokens from `DESIGN.md`
- No `px-` values that aren't in the spacing scale
- No Aceternity animations on the canvas cells — only on UI chrome
- No Server-Side Rendering (SSR) or Server Actions — the app must be fully exportable as a static site (`output: 'export'`)

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `BrickCanvas.tsx` |
| Hooks | camelCase, `use` prefix | `useBrickCanvas.ts` |
| Utilities | camelCase | `colorMapping.ts` |
| Types | PascalCase | `LegoColor`, `BrickState` |
| Tailwind tokens | kebab-case | `bg-brick-red` |
| Constants | SCREAMING_SNAKE | `LEGO_PALETTE` |

---

## Before writing any component

1. Check if shadcn already has it — prefer shadcn over writing from scratch
2. Check if an Aceternity component fits — use for hero animations, upload zone, progress effects
3. Read the relevant section of `DESIGN.md` for tokens
4. Keep the component dumb — logic lives in hooks or `lib/`

---

## Key files to read first

When working on a new feature, always read these before writing code:

- `src/types/index.ts` — understand the data model
- `src/lib/legoColors.ts` — LEGO palette and color types
- `src/hooks/useBrickCanvas.ts` — main state machine
- `DESIGN.md` — tokens, spacing, component patterns