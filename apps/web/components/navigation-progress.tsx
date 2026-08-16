"use client"

import { useSyncExternalStore } from "react"
import { navProgress } from "@/lib/nav-progress"

/**
 * The route-transition bar, pinned above the sticky header.
 *
 * Rendered once in the root layout, which client navigation never re-renders,
 * so the bar keeps its state while pages swap underneath it. All of the timing
 * lives in `lib/nav-progress` — this reads a number and turns it into a width.
 *
 * The bar itself is hidden from assistive technology: an indeterminate route
 * transition has no honest `aria-valuenow`, and a bar reporting invented
 * percentages is worse than one reporting nothing. The live region beside it
 * carries the part that is true.
 */
export function NavigationProgress() {
  const value = useSyncExternalStore(
    navProgress.subscribe,
    navProgress.getSnapshot,
    navProgress.getServerSnapshot
  )

  return (
    <>
      {value === null ? null : (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5"
        >
          {/* `scaleX` rather than `width` keeps the fill off the layout path,
              and the 150ms transition sits inside the design system's
              120–180ms band. Transitioning `transform` is the one deliberate
              exception to the color/border/opacity rule: this element's entire
              job is to move. No shadow, no glow, no pulse. */}
          <div
            className="h-full w-full origin-left bg-accent transition-transform duration-150 ease-out"
            style={{ transform: `scaleX(${value})` }}
          />
        </div>
      )}

      {/* Always mounted. A live region added to the page at the same moment its
          text appears is not reliably announced. */}
      <span aria-live="polite" className="sr-only">
        {value === null ? "" : "Loading page"}
      </span>
    </>
  )
}
