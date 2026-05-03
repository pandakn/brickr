'use client'

import { useState, useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { BackgroundBeams } from '@/components/ui/background-beams'
import { cn } from '@/lib/cn'

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function BrickIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 56 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Two studs */}
      <ellipse
        cx="16"
        cy="9"
        rx="9"
        ry="5.5"
        fill="currentColor"
        opacity="0.55"
      />
      <ellipse
        cx="40"
        cy="9"
        rx="9"
        ry="5.5"
        fill="currentColor"
        opacity="0.55"
      />
      {/* Brick body */}
      <rect
        x="3"
        y="12"
        width="50"
        height="22"
        rx="4"
        fill="currentColor"
        opacity="0.75"
      />
      {/* Bottom ledge */}
      <rect
        x="3"
        y="30"
        width="50"
        height="5"
        rx="2.5"
        fill="currentColor"
        opacity="0.40"
      />
    </svg>
  )
}

export interface DropZoneProps {
  onFile: (file: File) => void
}

export function DropZone({ onFile }: DropZoneProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null)

      if (rejected.length > 0) {
        const code = rejected[0]?.errors[0]?.code ?? ''
        if (code === 'file-too-large') {
          setError('That file is too large — maximum is 10 MB.')
        } else if (code === 'file-invalid-type') {
          setError('Only JPG, PNG, and WebP images are supported.')
        } else {
          setError('Could not read this file. Please try another.')
        }
        return
      }

      const file = accepted[0]
      if (file) onFile(file)
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_BYTES,
    multiple: false,
  })

  return (
    <div className="relative min-h-80 w-full overflow-hidden rounded-xl">
      {/* BackgroundBeams sits behind everything */}
      <BackgroundBeams className="opacity-25" />

      <div
        {...getRootProps()}
        className={cn(
          // Layout
          'relative z-10 flex min-h-80 w-full flex-col items-center justify-center',
          // Shape
          'rounded-xl border-2 border-dashed',
          // Interaction
          'cursor-pointer select-none',
          // Motion
          'duration-base transition-colors',
          // State variants
          isDragActive
            ? 'border-brick-red bg-brick-red/5'
            : 'border-sand-300 bg-sand-200/50 hover:border-brick-red'
        )}
      >
        <input {...getInputProps()} />

        <BrickIcon
          className={cn(
            'duration-base mb-4 h-12 w-12 transition-colors',
            isDragActive ? 'text-brick-red' : 'text-sand-400'
          )}
        />

        <p className="font-display text-base font-extrabold text-sand-700">
          {isDragActive ? 'Drop it!' : 'Drop your image here'}
        </p>

        <p className="mt-1 font-display text-sm text-sand-500">
          or click to browse
        </p>

        <p className="mt-3 font-mono text-[10px] tracking-widest text-sand-400 uppercase">
          JPG · PNG · WebP · max 10&nbsp;MB
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-brick-red/10 px-3 py-1.5 font-display text-sm font-bold text-brick-red">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
