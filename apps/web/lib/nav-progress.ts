/**
 * The state behind the route-transition bar at the top of every page.
 *
 * Deliberately free of React and the DOM. This app's test environment is Node
 * with `renderToStaticMarkup` and no jsdom, so anything living in an effect
 * cannot be tested here — and the parts worth testing are exactly the ones that
 * decide *whether* a bar appears and *how far along* it is. Those live here.
 * The component is a subscription and a `scaleX`.
 */

/** Where the fill starts when the bar first appears — `scaleX(0)` is invisible. */
const START = 0.08

export interface NavProgressOptions {
  /**
   * How long a navigation must stay pending before the bar appears at all.
   * Most navigations in this app commit faster than this, and a bar that
   * flashed on every click would read as jank rather than as feedback.
   */
  revealDelayMs?: number
  /** Once shown, stay up at least this long so the bar can never blink. */
  minVisibleMs?: number
  /** How often the fill advances while a navigation is pending. */
  tickMs?: number
  /**
   * The fill never passes this on its own — only a finished navigation takes it
   * to 1. A bar that reaches the end while still waiting is lying.
   */
  ceiling?: number
  /** Share of the remaining distance to `ceiling` closed on each tick. */
  closeFraction?: number
}

const DEFAULTS = {
  revealDelayMs: 120,
  minVisibleMs: 240,
  tickMs: 100,
  ceiling: 0.9,
  closeFraction: 0.18,
} satisfies Required<NavProgressOptions>

/**
 * One tick of the fill: close a fixed share of whatever distance is left to the
 * ceiling. The result approaches `ceiling` without reaching it, so a slow
 * response keeps showing movement while the bar never parks on a round number
 * that reads as a stall.
 */
export function advance(
  value: number,
  ceiling: number = DEFAULTS.ceiling,
  closeFraction: number = DEFAULTS.closeFraction
): number {
  return value + (ceiling - value) * closeFraction
}

export interface NavProgress {
  /**
   * A navigation started. Reference-counted rather than a boolean: clicking a
   * second link before the first commits leaves two navigations pending, and a
   * flag would clear on the first completion and strand the bar mid-page.
   */
  start(): void
  /** A navigation finished, was replaced, or its link left the page. */
  done(): void
  subscribe(listener: () => void): () => void
  /** `null` while idle, meaning the component renders nothing at all. */
  getSnapshot(): number | null
  /** Server render and hydration both start from idle. */
  getServerSnapshot(): null
  /** Test seam: drop all timers and listeners and go back to idle. */
  reset(): void
}

export function createNavProgress(
  options: NavProgressOptions = {}
): NavProgress {
  const { revealDelayMs, minVisibleMs, tickMs, ceiling, closeFraction } = {
    ...DEFAULTS,
    ...options,
  }

  const listeners = new Set<() => void>()
  let pending = 0
  let value: number | null = null
  let shownAt = 0
  let revealTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null
  let tickTimer: ReturnType<typeof setInterval> | null = null

  function emit() {
    for (const listener of listeners) listener()
  }

  function set(next: number | null) {
    if (next === value) return
    value = next
    emit()
  }

  function stopTicking() {
    if (tickTimer === null) return
    clearInterval(tickTimer)
    tickTimer = null
  }

  function startTicking() {
    stopTicking()
    tickTimer = setInterval(() => {
      if (value === null) return
      set(advance(value, ceiling, closeFraction))
    }, tickMs)
  }

  function reveal() {
    revealTimer = null
    shownAt = Date.now()
    set(START)
    startTicking()
  }

  function finish() {
    stopTicking()
    set(1)
    // Hold long enough for the fill-to-full to actually be seen, and long
    // enough overall to satisfy the minimum visible time.
    const elapsed = Date.now() - shownAt
    const hold = Math.max(minVisibleMs - elapsed, tickMs)
    hideTimer = setTimeout(() => {
      hideTimer = null
      set(null)
    }, hold)
  }

  return {
    start() {
      pending += 1
      if (pending > 1) return

      if (hideTimer !== null) {
        clearTimeout(hideTimer)
        hideTimer = null
      }

      // A bar still on screen from the last navigation keeps its place instead
      // of blinking out and waiting out the reveal delay again. If it had
      // already run to full, restart the fill — a new page really is loading.
      if (value !== null) {
        if (value >= ceiling) {
          shownAt = Date.now()
          set(START)
        }
        startTicking()
        return
      }

      revealTimer = setTimeout(reveal, revealDelayMs)
    },

    done() {
      if (pending === 0) return
      pending -= 1
      if (pending > 0) return

      // Never revealed, so there is nothing to wind down and nothing was ever
      // shown. This is the common case: the navigation beat the delay.
      if (revealTimer !== null) {
        clearTimeout(revealTimer)
        revealTimer = null
        stopTicking()
        set(null)
        return
      }

      if (value === null) {
        stopTicking()
        return
      }

      finish()
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    getSnapshot() {
      return value
    },

    getServerSnapshot() {
      return null
    },

    reset() {
      if (revealTimer !== null) clearTimeout(revealTimer)
      if (hideTimer !== null) clearTimeout(hideTimer)
      stopTicking()
      revealTimer = null
      hideTimer = null
      pending = 0
      shownAt = 0
      value = null
      listeners.clear()
    },
  }
}

/**
 * The app-wide instance. A module singleton rather than a context so a link in
 * the footer, a card deep in the showcase grid, and the bar in the root layout
 * can all reach the same state without a provider wrapping the tree or props
 * threaded through every server component in between.
 */
export const navProgress = createNavProgress()
