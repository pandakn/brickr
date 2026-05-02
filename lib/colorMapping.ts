/**
 * Brickr — colour-space maths
 *
 * Pipeline:  sRGB (0–255) → linearise → XYZ (D65) → CIE L*a*b*
 *
 * Public API
 * ──────────
 *  hexToLab(hex)              — CSS hex string → [L, a, b]
 *  deltaE(lab1, lab2)         — CIE76 ΔE distance
 *  nearestLegoColor(r, g, b)  — closest LEGO palette entry for an sRGB pixel
 *
 * All functions are pure and run in the browser only (no server calls).
 */

import type { LegoColor } from '@/types'
import { LEGO_PALETTE } from './legoColors'

// ─── Colour-space helpers ──────────────────────────────────────────────────

/**
 * Linearise a single sRGB channel in [0, 1].
 * Applies the IEC 61966-2-1 piecewise transfer function.
 */
function linearise(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * CIE-Lab cube-root function f(t).
 * Uses the linearised approximation below the ε³ threshold to avoid
 * undefined derivatives at zero.
 */
function labF(t: number): number {
  // ε = 6/29, ε³ ≈ 0.008856
  const EPSILON_CUBED = 0.008856
  const KAPPA = 7.787 // (29/6)² / 3
  const DELTA = 16 / 116
  return t > EPSILON_CUBED ? Math.cbrt(t) : KAPPA * t + DELTA
}

/**
 * Convert an sRGB pixel (channels 0–255) to CIE L*a*b* under the D65
 * standard illuminant (2° observer).  This is the inner kernel used by
 * both `hexToLab` and `nearestLegoColor` to avoid any string allocation.
 */
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // 1 — Normalise to [0, 1]
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255

  // 2 — Remove gamma (linearise)
  const rl = linearise(rn)
  const gl = linearise(gn)
  const bl = linearise(bn)

  // 3 — Linear sRGB → CIE XYZ (D65, 2° observer matrix, IEC 61966-2-1)
  const X = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl
  const Y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl
  const Z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl

  // 4 — Normalise by D65 white point (Xn=0.95047, Yn=1.00000, Zn=1.08883)
  const fx = labF(X / 0.95047)
  const fy = labF(Y / 1.00000)
  const fz = labF(Z / 1.08883)

  // 5 — XYZ → L*a*b*
  return [
    116 * fy - 16,   // L*
    500 * (fx - fy), // a*
    200 * (fy - fz), // b*
  ]
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Convert a CSS hex colour (e.g. `"#C91A09"` or `"#fff"`) to CIE L*a*b*.
 *
 * Handles both 3- and 6-digit hex notation.  The returned tuple matches the
 * `lab` field on `LegoColor` and can be fed directly into `deltaE`.
 */
export function hexToLab(hex: string): [number, number, number] {
  const raw = hex.replace('#', '')
  // Expand shorthand: "abc" → "aabbcc"
  const full = raw.length === 3
    ? raw.split('').map((c) => c + c).join('')
    : raw

  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)

  return rgbToLab(r, g, b)
}

/**
 * CIE76 ΔE (Euclidean distance in L*a*b* space).
 *
 * For a palette of 20 colours CIE76 is perceptually adequate and an order
 * of magnitude faster than ΔE2000.  Upgrade to ΔE2000 only if users report
 * that specific skin tones or near-greys are matching incorrectly.
 *
 * A ΔE value below ~2.3 is considered a "just noticeable difference" (JND)
 * under standard viewing conditions.
 */
export function deltaE(
  lab1: [number, number, number],
  lab2: [number, number, number],
): number {
  const dL = lab1[0] - lab2[0]
  const da = lab1[1] - lab2[1]
  const db = lab1[2] - lab2[2]
  return Math.sqrt(dL * dL + da * da + db * db)
}

/**
 * Find the perceptually nearest colour in the LEGO palette for a given
 * sRGB pixel (channels 0–255, as returned by `ImageData.data`).
 *
 * Complexity: O(P) where P = LEGO_PALETTE.length (≤ 20).
 * For a 64×64 image that's ≤ 81 920 comparisons — comfortably < 1 ms.
 */
export function nearestLegoColor(r: number, g: number, b: number): LegoColor {
  const inputLab = rgbToLab(r, g, b)

  let best: LegoColor = LEGO_PALETTE[0]
  let bestDist = Infinity

  for (const color of LEGO_PALETTE) {
    const dist = deltaE(inputLab, color.lab)
    if (dist < bestDist) {
      bestDist = dist
      best = color
    }
  }

  return best
}
