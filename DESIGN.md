# Brickr — DESIGN.md

> Design system reference. All Tailwind tokens, component patterns, and visual rules live here.
> Always read this before adding styles to any component.

---

## Fonts

```ts
// app/layout.tsx
import { Nunito, Space_Mono } from 'next/font/google'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-display',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
})
```

```js
// tailwind.config.ts
fontFamily: {
  display: ['var(--font-display)', 'sans-serif'],
  mono:    ['var(--font-mono)', 'monospace'],
}
```

### Usage

| Role                    | Class                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| Display / hero          | `font-display font-black text-4xl tracking-tight`                         |
| Heading                 | `font-display font-extrabold text-2xl`                                    |
| Subheading              | `font-display font-bold text-base`                                        |
| Body                    | `font-display font-normal text-sm text-sand-600`                          |
| Mono label / coord      | `font-mono font-bold text-xs text-sand-500`                               |
| Micro / uppercase label | `font-mono font-bold text-[10px] uppercase tracking-widest text-sand-400` |

---

## Color palette

Define in `tailwind.config.ts` under `theme.extend.colors`:

```js
colors: {
  brick: {
    red:    '#E3000B',
    blue:   '#006CB7',
    yellow: '#FFD700',
    green:  '#00A650',
    orange: '#F47216',
    black:  '#1A1A1A',
    white:  '#FAFAF8',
    gray:   '#8B8B8B',
  },
  sand: {
    50:  '#FDFAF5',
    100: '#F5F0E8',   // page background
    200: '#EDE5D4',   // subtle surface
    300: '#E8E0D0',   // card border, divider
    400: '#C8BBA8',   // muted border
    500: '#9E9080',   // tertiary text
    600: '#6B5F52',   // secondary text
    700: '#3D332A',   // primary text (light)
    800: '#1A1A1A',   // headings
  },
}
```

### Semantic usage

| Token             | Use                           |
| ----------------- | ----------------------------- |
| `bg-sand-100`     | Page background               |
| `bg-sand-200`     | Panel / card surface          |
| `border-sand-300` | Default card border           |
| `text-sand-800`   | Headings                      |
| `text-sand-600`   | Body copy                     |
| `text-sand-500`   | Labels, meta                  |
| `bg-brick-red`    | Primary CTA, active states    |
| `bg-brick-blue`   | Info badges, grid size active |
| `bg-brick-yellow` | Secondary CTA, highlight      |
| `bg-brick-green`  | Success state                 |
| `bg-brick-black`  | Dark stud cells               |

---

## Spacing scale

Follow Tailwind defaults — these are the ones used in Brickr:

| Token             | px   | Use                          |
| ----------------- | ---- | ---------------------------- |
| `gap-1` / `p-1`   | 4px  | Tight internal gaps          |
| `gap-2` / `p-2`   | 8px  | Icon-label gap, stud padding |
| `gap-3` / `p-3`   | 12px | Component inner padding      |
| `gap-5` / `p-5`   | 20px | Card padding                 |
| `gap-8` / `p-8`   | 32px | Panel padding, section gap   |
| `gap-12` / `p-12` | 48px | Layout gap                   |

---

## Border radius

```js
// tailwind.config.ts
borderRadius: {
  stud: '4px',
  sm:   '6px',
  md:   '12px',
  lg:   '20px',
  xl:   '28px',
  // pill: use rounded-full
}
```

| Token          | Use                           |
| -------------- | ----------------------------- |
| `rounded-stud` | Canvas cells                  |
| `rounded-sm`   | Small badges, small buttons   |
| `rounded-md`   | Buttons, grid pills, inputs   |
| `rounded-lg`   | Cards, panels                 |
| `rounded-xl`   | Large modals, floating panels |
| `rounded-full` | Pill badges, avatar circles   |

---

## Elevation (shadow)

```js
// tailwind.config.ts
boxShadow: {
  flat:     'none',
  raised:   '0 1px 4px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.06)',
  floating: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.08)',
  stud:     'inset 0 -2px 0 rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.08)',
}
```

| Token             | Use                        |
| ----------------- | -------------------------- |
| `shadow-flat`     | Default cards on page bg   |
| `shadow-raised`   | Panels, stat cards         |
| `shadow-floating` | Control panel, floating UI |
| `shadow-stud`     | Individual LEGO stud cells |

---

## Motion tokens

```js
// tailwind.config.ts
transitionDuration: {
  snap:   '80ms',
  micro:  '120ms',
  base:   '200ms',
  slow:   '400ms',
}

transitionTimingFunction: {
  snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // slight overshoot for snap
  base: 'cubic-bezier(0.4, 0, 0.2, 1)',
}

keyframes: {
  'stud-pop': {
    '0%':   { transform: 'scale(1) translateY(0)' },
    '50%':  { transform: 'scale(1.08) translateY(-2px)' },
    '100%': { transform: 'scale(1) translateY(0)' },
  },
  'build-in': {
    '0%':   { opacity: '0', transform: 'scale(0.6)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  'confetti-drop': {
    '0%':   { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
    '100%': { transform: 'translateY(60px) rotate(360deg)', opacity: '0' },
  },
}

animation: {
  'stud-pop':      'stud-pop 200ms ease-in-out',
  'build-in':      'build-in 80ms ease-out forwards',
  'confetti-drop': 'confetti-drop 800ms ease-in forwards',
}
```

### Motion rules

- Canvas stud cells: `hover:animate-stud-pop` — never `transition` on cells, always keyframe
- Progressive build: 16ms delay per cell index — compute with `animationDelay: \`${index \* 16}ms\``
- Panels and controls: `transition-all duration-base`
- Button press: `active:scale-[0.97] transition-transform duration-micro`

---

## Component patterns

### Stud cell

The atomic unit. Renders as a colored square with a circular stud on top.

```tsx
// StudCell.tsx
interface StudCellProps {
  color: LegoColor
  size?: number // px, default 16
  isHovered?: boolean
  isSelected?: boolean
}

// Class composition
const cell = cn(
  'relative flex items-center justify-center rounded-stud',
  'duration-snap cursor-pointer transition-transform',
  'hover:-translate-y-px hover:scale-110',
  isSelected && 'ring-2 ring-white ring-offset-1'
)

const stud = cn(
  'rounded-full',
  'border border-white/40 bg-white/25'
  // size: 60% of cell
)
```

### Button — primary

```tsx
<button
  className={cn(
    'font-display text-sm font-extrabold',
    'bg-brick-red text-white',
    'rounded-md px-5 py-2.5',
    'hover:brightness-110 active:scale-[0.97]',
    'duration-micro transition-all'
  )}
>
  Build it
</button>
```

### Button — secondary

```tsx
<button
  className={cn(
    'font-display text-sm font-extrabold',
    'bg-sand-300 text-sand-800',
    'rounded-md px-5 py-2.5',
    'hover:bg-sand-400 active:scale-[0.97]',
    'duration-micro transition-all'
  )}
>
  Reset
</button>
```

### Button — ghost

```tsx
<button
  className={cn(
    'font-display text-sm font-extrabold',
    'border-2 border-brick-blue bg-transparent text-brick-blue',
    'rounded-md px-5 py-2.5',
    'hover:bg-brick-blue/10 active:scale-[0.97]',
    'duration-micro transition-all'
  )}
>
  Compare
</button>
```

### Badge

```tsx
const badgeVariants = {
  red: 'bg-brick-red text-white',
  blue: 'bg-brick-blue text-white',
  yellow: 'bg-brick-yellow text-sand-800',
  green: 'bg-brick-green text-white',
  sand: 'bg-sand-300 text-sand-700',
}

// Base: rounded-full px-3 py-0.5 text-xs font-display font-bold
```

### Grid size pill (toggle group)

```tsx
// active
'bg-brick-blue text-white border-brick-blue'

// inactive
'bg-sand-200 text-sand-600 border-sand-300 hover:border-sand-400'

// base
'border-[1.5px] px-3.5 py-1.5 rounded-md font-display font-extrabold text-xs cursor-pointer transition-all duration-base'
```

### Floating panel

```tsx
<div className={cn(
  'fixed z-20',
  'bg-sand-100/90 backdrop-blur-md',
  'border border-sand-300',
  'rounded-xl shadow-floating',
  'p-5',
)}>
```

### Card (color breakdown row)

```tsx
<div className="flex items-center gap-2.5">
  {/* Color stud */}
  <div
    className="flex h-5 w-5 items-center justify-center rounded-stud"
    style={{ background: color.hex }}
  >
    <div className="h-2.5 w-2.5 rounded-full border border-white/50 bg-white/30" />
  </div>
  {/* Name */}
  <span className="flex-1 font-display text-sm font-bold text-sand-700">
    {color.name}
  </span>
  {/* Bar */}
  <div className="h-2 flex-[2] overflow-hidden rounded-full bg-sand-200">
    <div
      className="duration-slow h-full rounded-full transition-all"
      style={{ width: `${pct}%`, background: color.hex }}
    />
  </div>
  {/* Count */}
  <span className="min-w-[32px] text-right font-mono text-xs font-bold text-sand-500">
    {count}
  </span>
</div>
```

### Drop zone (Aceternity)

Use Aceternity's `<FileUpload>` component. Wrap in:

```tsx
<div className={cn(
  'rounded-xl border-2 border-dashed border-sand-300',
  'hover:border-brick-red transition-colors duration-base',
  'bg-sand-200/50',
)}>
```

### Progress / build animation

Use Aceternity's `<AnimatedProgressBar>` or roll a custom one:

```tsx
<div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
  <div
    className="duration-base h-full rounded-full bg-brick-red transition-all"
    style={{ width: `${progress * 100}%` }}
  />
</div>
```

---

## Layout

```
+------------------+-----------------------------+------------------+
|    [logo]        |                             |                  |
+------------------+   B R I C K   C A N V A S   |   Stats panel    |
|  Control panel   |                             |  (fixed right)   |
|  (fixed left/    |   (central, fills space)    |                  |
|   bottom)        |                             |  Color breakdown |
|                  |                             |  Piece count     |
|  Grid size       |                             |  Build time est  |
|  Messiness       |                             |                  |
|  Render mode     |                             |                  |
|  Build btn       |                             |                  |
+------------------+-----------------------------+------------------+
```

- Canvas: `flex-1 min-h-0` — fills remaining space
- Control panel: `w-64 shrink-0` fixed left, or bottom sheet on mobile
- Stats panel: `w-56 shrink-0` fixed right
- Top bar: `h-14` with logo only — no navigation

---

## Dark mode

Brickr is **light-only**. Do not add `dark:` variants. The sand palette is the brand — dark mode would break the toy aesthetic.

Disable dark mode in `tailwind.config.ts`:

```js
darkMode: false,  // or omit entirely
```

---

## Aceternity components in use

| Component         | Where                           |
| ----------------- | ------------------------------- |
| `FileUpload`      | `DropZone.tsx`                  |
| `BackgroundBeams` | Empty state behind canvas       |
| `SparklesCore`    | Completion confetti effect      |
| `AnimatedTooltip` | Color swatch hover in breakdown |
| `Progress`        | Build animation progress bar    |

Always import Aceternity components from `@/components/ui/` after copying with the CLI.

---

## Do not do

- No `text-gray-*` — use `text-sand-*` tokens
- No arbitrary Tailwind values like `w-[137px]` — use scale
- No inline `style={{ color: '...' }}` for text — only for dynamic canvas cell colors
- No `rounded-[8px]` — use `rounded-md`
- No Aceternity animations on canvas cells — performance kill
- No `transition-all` on canvas cells — use keyframes only
