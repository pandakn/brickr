# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brickr converts images into LEGO-style pixel art entirely client-side. It's a single-page app with no auth, no API routes, no server-side processing — everything runs in the browser via Canvas API.

## Commands

```bash
# Development
bun dev                    # Start dev server with Turbopack (http://localhost:3000)

# Build & Lint
bun run build              # Static export build (outputs to out/)
bun run lint               # ESLint
bun run typecheck          # TypeScript type checking (tsc --noEmit)
bun run format             # Prettier (auto-formats all .ts/.tsx)

# Testing
bun run test               # Run all tests once (vitest run)
bun run test:watch         # Watch mode
bun run test:ui            # Vitest UI

# Single test file
npx vitest run path/to/file.test.tsx
```

## Architecture

**Static export app**: `next.config.mjs` sets `output: 'export'` — no SSR, no server actions, no API routes. The app must remain fully exportable.

**Single-page layout**: `app/page.tsx` (~500 lines) is the entire app. It composes all components and orchestrates the image → pixel matrix → canvas pipeline. `app/layout.tsx` sets up fonts (Nunito + Space Mono) and wraps with TooltipProvider.

**Data flow**:
1. User uploads image → `useImageProcessor` hook processes it via Canvas API
2. `lib/imageProcessor.ts` resizes and quantizes pixels to a grid
3. `lib/colorMapping.ts` maps each pixel to the nearest LEGO color using LAB delta-E distance
4. Result is a `LegoColor[][]` matrix — the single source of truth
5. `BrickCanvas` renders the matrix as a grid of `StudCell` components

**State**: `useBrickCanvas` hook manages all app state (grid size, messiness, render mode, build progress). The `BrickState` type in `types/index.ts` defines the full shape.

**Key lib files**:
- `lib/legoColors.ts` — LEGO palette with pre-computed LAB values
- `lib/colorMapping.ts` — LAB color space matching (sRGB → XYZ → CIE L*a*b*)
- `lib/imageProcessor.ts` — canvas resize + quantization pipeline
- `lib/exportCanvas.ts` — image/build guide export

## Directory Structure

```
app/              Next.js App Router (layout, page, globals.css)
components/
  canvas/         BrickCanvas, StudCell, BeforeAfterSlider
  controls/       ControlPanel, GridSizePicker, MessinessSlider
  stats/          StatsPanel, ColorBreakdown
  upload/         DropZone
  ui/             shadcn/ui + Aceternity components (button, badge, file-upload, sparkles, etc.)
hooks/            useBrickCanvas, useImageProcessor, useSound
lib/              Color mapping, image processing, export, utilities
types/            Shared TypeScript types (all in types/index.ts)
```

Tests are co-located: `Component.test.tsx` sits next to `Component.tsx`.

## Coding Conventions

- **Strict TypeScript**: no `any`, no `as unknown`
- **Named exports only** — default exports only for `page.tsx` and `layout.tsx`
- **Props interfaces**: `[ComponentName]Props`
- **Client components**: mark with `'use client'` at top
- **No `useEffect` for derived state** — use `useMemo` or compute inline
- **No hardcoded hex colors** — use Tailwind tokens from DESIGN.md
- **No dark mode** — app is light-only, no `dark:` variants
- **No arbitrary Tailwind values** — use the spacing/color scale

## Testing

- **Vitest** with jsdom environment, globals enabled
- Tests use `@testing-library/react` with `describe`/`test` blocks
- Mock hooks with `vi.mock(import('@/hooks/useBrickCanvas'))` pattern
- `vitest.setup.ts` mocks: `requestAnimationFrame`, `ImageData`, `ResizeObserver`, `performance.now`
- Canvas-related tests mock the hooks and lib modules rather than testing actual canvas rendering

## Prettier Config

No semicolons, single quotes, 2-space tabs, trailing commas (es5), 80 char width. Tailwind classes auto-sorted via `prettier-plugin-tailwindcss`.

## Path Aliases

`@/*` maps to project root (e.g., `@/components/...`, `@/lib/...`, `@/hooks/...`).

## Design System

See `DESIGN.md` for the full token reference. Key points:
- Color palette: `sand-*` (neutrals) + `brick-*` (accent colors)
- Fonts: `font-display` (Nunito) for headings, `font-mono` (Space Mono) for data
- Shadows: `shadow-raised`, `shadow-floating`, `shadow-stud`
- Animations: `stud-pop`, `build-in`, `confetti-drop` keyframes
- Never use Aceternity animations on canvas cells — only on UI chrome
