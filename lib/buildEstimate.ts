/**
 * Brickr — build-time estimates
 *
 * A single source of truth for how long a pattern takes to build so the
 * control panel, the stats panel and any future surface never disagree.
 * Estimates are deliberately simple: an average builder places one brick
 * every 15 seconds, so time is linear in the number of physical pieces.
 * Empty cells are not physical pieces and must be excluded by the caller
 * (i.e. pass `computePieceCounts(matrix)` totals, never the grid capacity).
 */

/** Average seconds a person spends placing one brick. */
export const SECONDS_PER_PIECE = 15

/** Estimated build time in whole minutes for `pieces` physical bricks. */
export function estimateBuildMinutes(pieces: number): number {
  return Math.round((pieces * SECONDS_PER_PIECE) / 60)
}
