/**
 * Brickr — canonical LEGO colour codes
 *
 * Every palette colour gets one deterministic, human-readable code that is
 * used wherever build instructions need to identify a brick: guide cells,
 * the guide legend, and (later) the parts list.
 *
 * Codes are keyed by the stable `LegoColor.id`, never by palette position or
 * by the colours currently in use, so a guide stays decodable when the same
 * colour appears under a different image or grid size.
 *
 * Scheme
 * ──────
 *   single-word colours    → two letters       white        → "WH"
 *   two-word colours       → word initials     dark-red     → "DR"
 *   three-word colours     → initials          dark-stone-grey → "DSG"
 *
 * Where two colours would share initials (bright-pink / bright-purple) one of
 * them is extended to a longer form (bright-purple → "PU") so that every code
 * in the palette is unique. The result is a fixed table that is curated by
 * hand and validated by tests — never generated from the palette order or
 * from the colours in the current design.
 *
 * `COLOR_CODES` is the single source of truth. `getColorCode` throws for an
 * unregistered id instead of guessing an abbreviation that could collide, and
 * `findColorCodeIssues` reports missing, malformed, duplicate or orphaned
 * allocations so tests fail loudly when the palette grows without a matching
 * code.
 */

import type { LegoColor } from '@/types'

/** Longest code that still renders legibly inside a 28 px guide cell. */
export const COLOR_CODE_MAX_LENGTH = 3

/**
 * Canonical code per stable colour id.
 *
 * A missing key means "no code allocated yet" — that is a hard error, never a
 * fallback. `findColorCodeIssues` turns such a mismatch into a test failure.
 */
export const COLOR_CODES: Readonly<Record<string, string | undefined>> =
  Object.freeze({
    // ── Neutrals ──────────────────────────────────────────────────────────
    white: 'WH',
    black: 'BK',
    tan: 'TN',
    'medium-stone-grey': 'MSG',
    'dark-stone-grey': 'DSG',
    'light-bluish-grey': 'LBG',

    // ── Reds & browns ─────────────────────────────────────────────────────
    'bright-red': 'RED',
    'dark-red': 'DR',
    'reddish-brown': 'RB',

    // ── Oranges & yellows ─────────────────────────────────────────────────
    'bright-orange': 'BO',
    'bright-yellow': 'BY',
    lime: 'LI',

    // ── Greens ────────────────────────────────────────────────────────────
    'bright-green': 'BG',
    'dark-green': 'DG',
    'sand-green': 'SG',

    // ── Blues ─────────────────────────────────────────────────────────────
    'medium-azure': 'MA',
    'bright-blue': 'BB',
    'dark-blue': 'DB',

    // ── Purples & pinks ───────────────────────────────────────────────────
    'bright-purple': 'PU',
    magenta: 'MG',
    'dark-pink': 'DP',
    'bright-pink': 'BP',
    'light-purple': 'LP',
    'medium-lavender': 'ML',
    lavender: 'LV',
  })

/** Valid code shape: 1–3 uppercase alphanumerics, starting with a letter. */
const CODE_PATTERN = /^[A-Z][A-Z0-9]{0,2}$/

/**
 * Canonical code for `color`.
 *
 * Throws when the colour has no registered code — a missing code is a bug in
 * the palette/registry pair, not something to paper over with a fallback that
 * may collide with another colour.
 */
export function getColorCode(color: Pick<LegoColor, 'id'>): string {
  const code = COLOR_CODES[color.id]

  if (code === undefined) {
    throw new Error(
      `No colour code registered for "${color.id}". ` +
        'Add it to COLOR_CODES in lib/colorCodes.ts.'
    )
  }

  return code
}

/** A problem found while validating a palette ↔ code-registry pairing. */
export type ColorCodeIssue =
  | { kind: 'missing'; id: string }
  | { kind: 'malformed'; id: string; code: string }
  | { kind: 'duplicate'; code: string; ids: string[] }
  | { kind: 'unknown'; id: string }

/**
 * Validate a colour-code registry against a palette.
 *
 * Returns every missing, malformed, duplicate or orphaned allocation. An
 * empty array means the registry is safe to use for build guides. Pass a
 * custom `codes` record in tests to prove that a bad registry is detected.
 */
export function findColorCodeIssues(
  palette: readonly LegoColor[],
  codes: Readonly<Record<string, string | undefined>> = COLOR_CODES
): ColorCodeIssue[] {
  const issues: ColorCodeIssue[] = []
  const ownersByCode = new Map<string, string[]>()
  const paletteIds = new Set(palette.map((color) => color.id))

  for (const color of palette) {
    const code = codes[color.id]

    if (code === undefined) {
      issues.push({ kind: 'missing', id: color.id })
      continue
    }

    if (!CODE_PATTERN.test(code)) {
      issues.push({ kind: 'malformed', id: color.id, code })
    }

    const owners = ownersByCode.get(code)
    if (owners) {
      owners.push(color.id)
    } else {
      ownersByCode.set(code, [color.id])
    }
  }

  for (const [code, ids] of ownersByCode) {
    if (ids.length > 1) {
      issues.push({ kind: 'duplicate', code, ids })
    }
  }

  // Codes left behind by a removed or renamed palette colour.
  for (const id of Object.keys(codes)) {
    if (!paletteIds.has(id)) {
      issues.push({ kind: 'unknown', id })
    }
  }

  return issues
}
