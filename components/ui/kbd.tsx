import * as React from "react"
import { cn } from "@/lib/cn"

export interface KbdProps extends React.ComponentPropsWithoutRef<"kbd"> {}

/**
 * Kbd — keyboard shortcut indicator
 * 
 * Styled to match the Brickr "sand" palette. Uses the mono font
 * for a technical but toy-like feel.
 */
const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sand-300 bg-sand-200 px-1.5 font-mono text-[10px] font-bold text-sand-500 opacity-100",
          className
        )}
        {...props}
      />
    )
  }
)
Kbd.displayName = "Kbd"

export { Kbd }
