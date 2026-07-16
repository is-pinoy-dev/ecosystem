"use client"

import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { Moon, SunDim } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

// Adapted from magicui.design/docs/components/animated-theme-toggler.
// Wired to next-themes so it stays in sync with the rest of the app (e.g. the
// "d" keyboard shortcut) and falls back to a plain toggle where the View
// Transitions API is unavailable or reduced motion is requested.
export function AnimatedThemeToggler({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Defer theme-dependent rendering until mount to avoid a hydration mismatch
  // (next-themes resolves the active theme only on the client).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  const toggleTheme = async () => {
    const next = isDark ? "light" : "dark"
    const button = buttonRef.current

    if (
      !button ||
      typeof document.startViewTransition !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(next)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    }).ready

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 640,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      aria-label={
        mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"
      }
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center text-foreground transition-colors duration-[140ms] hover:text-accent focus-visible:text-accent",
        className
      )}
    >
      {mounted && isDark ? (
        <SunDim className="size-[18px]" aria-hidden="true" />
      ) : (
        <Moon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  )
}
