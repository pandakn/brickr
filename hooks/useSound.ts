'use client'

/**
 * useSound
 *
 * Manages a single shared Web Audio API context and exposes a synthetic
 * "stud click" sound effect that can be enabled or disabled by the user.
 *
 * Design notes
 * ────────────
 * • AudioContext is created lazily (inside toggleSound) so it is only
 *   instantiated after a user gesture, satisfying browser autoplay policy.
 * • playClick() is a no-op when disabled or on the server so it is safe
 *   to call unconditionally from event handlers.
 * • The click is a brief square-wave oscillator with exponential pitch +
 *   volume decay — short enough to feel like a mechanical key press.
 */

import { useCallback, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────

export type UseSoundReturn = {
  soundEnabled: boolean
  toggleSound: () => void
  /** Play one synthetic click.  Silently ignored when disabled. */
  playClick: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useSound(): UseSoundReturn {
  const [soundEnabled, setSoundEnabled] = useState(false)
  /** Lazily initialised — created on first toggleSound call. */
  const ctxRef = useRef<AudioContext | null>(null)

  /** Returns the shared AudioContext, creating it if needed. */
  function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!ctxRef.current) {
      try {
        ctxRef.current = new AudioContext()
      } catch {
        return null // browser may block (very old / restricted)
      }
    }
    return ctxRef.current
  }

  const playClick = useCallback((): void => {
    if (!soundEnabled) return
    const ctx = getCtx()
    if (!ctx) return

    // Resume if the browser suspended the context between interactions
    if (ctx.state === 'suspended') void ctx.resume()

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Brief square-wave blip: pitch drops from 600 Hz → 280 Hz over 40 ms
    osc.type = 'square'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.04)

    // Volume envelope: sharp attack, exponential release to silence at 70 ms
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07)

    osc.start(now)
    osc.stop(now + 0.07)
  }, [soundEnabled]) // re-creates only when soundEnabled changes

  const toggleSound = useCallback((): void => {
    setSoundEnabled((v) => !v)
    // Eagerly create the AudioContext here (user gesture context) so that
    // the first playClick() call after enabling doesn't have to wait.
    getCtx()
  }, [])

  return { soundEnabled, toggleSound, playClick }
}
