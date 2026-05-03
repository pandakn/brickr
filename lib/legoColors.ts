/**
 * Brickr — LEGO colour palette
 *
 * Each entry's `lab` tuple was derived offline using the standard pipeline:
 *   sRGB (0-255) → linearise → XYZ (D65) → CIE L*a*b*
 *
 * The values match the computation in colorMapping.hexToLab() to within ±1
 * unit on each axis (rounding in the last decimal place).
 *
 * Sources for hex values: Bricklink colour reference + official LEGO colour
 * charts.  IDs are kebab-case slugs of the official LEGO System colour names.
 */

import type { LegoColor } from '@/types'

export const LEGO_PALETTE: LegoColor[] = [
  // ── Neutrals ────────────────────────────────────────────────────────────
  {
    id: 'white',
    name: 'White',
    hex: '#FFFFFF',
    lab: [100, 0, 0],
  },
  {
    id: 'black',
    name: 'Black',
    hex: '#05131D',
    lab: [5, -2, -8],
  },
  {
    id: 'medium-stone-grey',
    name: 'Medium Stone Grey',
    hex: '#A0A5A9',
    lab: [67, -1, -3],
  },
  {
    id: 'dark-stone-grey',
    name: 'Dark Stone Grey',
    hex: '#6C6E68',
    lab: [48, -2, 3],
  },
  {
    id: 'light-bluish-grey',
    name: 'Light Bluish Grey',
    hex: '#A5ACB4',
    lab: [70, -1, -5],
  },
  {
    id: 'tan',
    name: 'Tan',
    hex: '#E4CD9E',
    lab: [83, 1, 26],
  },

  // ── Reds & Browns ───────────────────────────────────────────────────────
  {
    id: 'bright-red',
    name: 'Bright Red',
    hex: '#C91A09',
    lab: [43, 64, 54],
  },
  {
    id: 'dark-red',
    name: 'Dark Red',
    hex: '#720E0F',
    lab: [23, 45, 27],
  },
  {
    id: 'reddish-brown',
    name: 'Reddish Brown',
    hex: '#694028',
    lab: [31, 15, 22],
  },

  // ── Oranges & Yellows ───────────────────────────────────────────────────
  {
    id: 'bright-orange',
    name: 'Bright Orange',
    hex: '#FE8A18',
    lab: [71, 34, 71],
  },
  {
    id: 'bright-yellow',
    name: 'Bright Yellow',
    hex: '#F5CD2F',
    lab: [84, 0, 76],
  },
  {
    id: 'lime',
    name: 'Lime',
    hex: '#95B90B',
    lab: [70, -32, 70],
  },

  // ── Greens ──────────────────────────────────────────────────────────────
  {
    id: 'bright-green',
    name: 'Bright Green',
    hex: '#4B9F4A',
    lab: [59, -43, 36],
  },
  {
    id: 'dark-green',
    name: 'Dark Green',
    hex: '#184632',
    lab: [28, -22, 10],
  },
  {
    id: 'sand-green',
    name: 'Sand Green',
    hex: '#A0BCB8',
    lab: [74, -10, -1],
  },

  // ── Blues ───────────────────────────────────────────────────────────────
  {
    id: 'medium-azure',
    name: 'Medium Azure',
    hex: '#78C5E7',
    lab: [76, -15, -24],
  },
  {
    id: 'bright-blue',
    name: 'Bright Blue',
    hex: '#0055BF',
    lab: [38, 21, -62],
  },
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    hex: '#0A3463',
    lab: [22, 6, -32],
  },

  // ── Purples & Pinks ─────────────────────────────────────────────────────
  {
    id: 'bright-purple',
    name: 'Bright Purple',
    hex: '#81007F',
    lab: [30, 59, -36],
  },
  {
    id: 'magenta',
    name: 'Magenta',
    hex: '#923978',
    lab: [39, 45, -17],
  },
  {
    id: 'dark-pink',
    name: 'Dark Pink',
    hex: '#C870A0',
    lab: [58, 41, -11],
  },
  {
    id: 'bright-pink',
    name: 'Bright Pink',
    hex: '#FF9ECD',
    lab: [76, 42, -9],
  },
  {
    id: 'light-purple',
    name: 'Light Purple',
    hex: '#FECCCF',
    lab: [86, 18, 5],
  },
  {
    id: 'medium-lavender',
    name: 'Medium Lavender',
    hex: '#AC78BA',
    lab: [58, 32, -27],
  },
  {
    id: 'lavender',
    name: 'Lavender',
    hex: '#E1D5ED',
    lab: [87, 8, -10],
  },
]
