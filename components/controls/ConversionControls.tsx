'use client'

import type {
  ConversionProfile,
  ConversionSettings,
  ImageFraming,
} from '@/types'
import { cn } from '@/lib/cn'

interface ConversionControlsProps {
  value: ConversionSettings
  onChange: (settings: ConversionSettings) => void
}

const profiles: { id: ConversionProfile; label: string; hint: string }[] = [
  {
    id: 'avatar',
    label: 'Avatar / Logo',
    hint: 'Shape-first, up to 8 colours',
  },
  { id: 'pixel-art', label: 'Pixel Art', hint: 'Keeps hard pixel edges' },
  { id: 'photo', label: 'Photo', hint: 'Smooth tones and detail' },
]

export function ConversionControls({
  value,
  onChange,
}: ConversionControlsProps) {
  const changeProfile = (profile: ConversionProfile) => {
    if (profile === 'avatar') {
      onChange({ profile, framing: value.framing, maxColors: 4 })
    } else {
      onChange({ profile, framing: value.framing })
    }
  }

  const updateFraming = (framing: ImageFraming) => {
    switch (value.profile) {
      case 'avatar':
        onChange({ ...value, framing })
        break
      case 'pixel-art':
      case 'photo':
        onChange({ ...value, framing })
        break
    }
  }

  return (
    <section aria-label="Image conversion" className="space-y-3">
      <p className="font-mono text-[10px] tracking-widest text-sand-400 uppercase">
        Image style
      </p>
      <div
        className="grid grid-cols-3 gap-1"
        role="group"
        aria-label="Image style"
      >
        {profiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            aria-pressed={value.profile === profile.id}
            onClick={() => changeProfile(profile.id)}
            className={cn(
              'rounded-md border px-1.5 py-2 text-center font-display text-[10px] font-extrabold',
              value.profile === profile.id
                ? 'border-brick-blue bg-brick-blue text-white'
                : 'border-sand-300 bg-sand-200 text-sand-600 hover:border-sand-400'
            )}
          >
            {profile.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-sand-500">
        {profiles.find((profile) => profile.id === value.profile)?.hint}
      </p>

      {value.profile === 'avatar' && (
        <label className="flex items-center justify-between gap-3 font-display text-xs font-bold text-sand-700">
          Max colours
          <select
            aria-label="Maximum colours"
            value={value.maxColors}
            onChange={(event) =>
              onChange({ ...value, maxColors: Number(event.target.value) })
            }
            className="rounded border border-sand-300 bg-sand-100 px-2 py-1"
          >
            {Array.from({ length: 7 }, (_, index) => index + 2).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex items-center justify-between gap-3 font-display text-xs font-bold text-sand-700">
        Frame
        <select
          aria-label="Image framing"
          value={value.framing.fit}
          onChange={(event) =>
            updateFraming({
              ...value.framing,
              fit: event.target.value === 'cover' ? 'cover' : 'contain',
            })
          }
          className="rounded border border-sand-300 bg-sand-100 px-2 py-1"
        >
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
        </select>
      </label>

      <RangeControl
        label="Zoom"
        value={value.framing.zoom}
        min={1}
        max={3}
        step={0.1}
        display={`${value.framing.zoom.toFixed(1)}×`}
        onChange={(zoom) => updateFraming({ ...value.framing, zoom })}
      />
      <RangeControl
        label="Horizontal crop"
        value={value.framing.positionX}
        min={0}
        max={1}
        step={0.05}
        display={`${Math.round(value.framing.positionX * 100)}%`}
        onChange={(positionX) => updateFraming({ ...value.framing, positionX })}
      />
      <RangeControl
        label="Vertical crop"
        value={value.framing.positionY}
        min={0}
        max={1}
        step={0.05}
        display={`${Math.round(value.framing.positionY * 100)}%`}
        onChange={(positionY) => updateFraming({ ...value.framing, positionY })}
      />
    </section>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}) {
  return (
    <label className="grid grid-cols-[1fr_auto] gap-x-2 font-display text-xs font-bold text-sand-700">
      <span>{label}</span>
      <span className="font-mono text-[10px] text-sand-500">{display}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="col-span-2 w-full accent-brick-blue"
      />
    </label>
  )
}
