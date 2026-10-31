import { describe, expect, test } from 'vitest'
import { estimateBuildMinutes } from './buildEstimate'

describe('estimateBuildMinutes', () => {
  test('returns 0 for an empty pattern', () => {
    expect(estimateBuildMinutes(0)).toBe(0)
  })

  test('uses 15 seconds per brick and rounds to whole minutes', () => {
    expect(estimateBuildMinutes(4)).toBe(1) // 1.0 min
    expect(estimateBuildMinutes(100)).toBe(25) // 25 min
    expect(estimateBuildMinutes(1024)).toBe(256) // 256 min
  })
})
